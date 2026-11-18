/* eslint-disable no-console */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { OAuth2Client } from 'google-auth-library'
import pg from 'pg'

const app = express()
app.use(cors())
app.use(bodyParser.json({ limit: '8mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '8mb' }))

const port = process.env.PORT || 3001
const { POSTGRES_URL, GOOGLE_CLIENT_ID } = process.env

if (!POSTGRES_URL) {
  console.error('Missing POSTGRES_URL')
  process.exit(1)
}
if (!GOOGLE_CLIENT_ID) {
  console.error('Missing GOOGLE_CLIENT_ID')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

pool.on('error', (err) => {
  console.error('Postgres pool error:', err.message)
})

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

function sendError(res, e) {
  console.error(e)
  const status = e?.status || 500
  const error =
    status === 401
      ? e?.message || 'invalid_token'
      : e?.message || 'internal_error'
  res.status(status).json({ ok: false, error })
}

async function verifyIdToken(idToken) {
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })
    const payload = ticket.getPayload()
    if (!payload) {
      const err = new Error('invalid_token')
      err.status = 401
      throw err
    }
    return payload
  } catch (e) {
    if (e?.status === 401) throw e
    const expired = /Token used too late|Expired/i.test(String(e?.message || ''))
    const err = new Error(expired ? 'token_expired' : 'invalid_token')
    err.status = 401
    throw err
  }
}

function slugify(text) {
  return (
    String(text || 'evento')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'evento'
  )
}

async function ensureUniqueSlug(base, eventId) {
  const slug = slugify(base)
  let attempt = slug
  let n = 0
  while (true) {
    const { rows } = await pool.query(
      'SELECT id FROM events WHERE public_slug = $1 AND id != $2',
      [attempt, eventId],
    )
    if (!rows.length) return attempt
    n += 1
    attempt = `${slug}-${n}`
  }
}

function parseJsonConfig(raw) {
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function buildTicketQrPayload({
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  attendeeId,
  buyerName,
  buyerSurname,
  tierName,
  amountCents,
  currency,
  referenceCode,
  buyerEmail,
  buyerWhatsapp,
}) {
  const fullName = `${buyerName} ${buyerSurname || ''}`.trim()
  return {
    type: 'TICKET',
    eventId,
    evento: eventTitle || '',
    fecha: eventDate || '',
    lugar: eventLocation || '',
    attendeeId,
    nombre: String(buyerName || ''),
    apellido: buyerSurname ? String(buyerSurname) : '',
    name: fullName,
    tier: tierName,
    monto: amountCents != null ? String(Number(amountCents) / 100) : '',
    currency: currency || 'ARS',
    referencia: referenceCode || '',
    email: buyerEmail || '',
    whatsapp: buyerWhatsapp || '',
  }
}

/** Normalize AR / international phone for wa.me (digits only, with country code). */
function normalizeWhatsappDigits(raw) {
  if (!raw) return ''
  let digits = String(raw).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '')
  // Local AR mobile: 11... or 15... → 549...
  if (digits.length === 10 && digits.startsWith('11')) digits = `549${digits}`
  else if (digits.length === 10) digits = `54${digits}`
  else if (digits.length === 11 && digits.startsWith('15')) digits = `549${digits.slice(2)}`
  else if (digits.startsWith('54') && !digits.startsWith('549') && digits.length >= 12) {
    // 5411... → 54911... (standard WhatsApp AR mobile)
    digits = `549${digits.slice(2)}`
  }
  return digits
}

/**
 * Meta test allowlist is picky with AR mobiles. Try:
 * - 54911XXXXXXXX (formato moderno WhatsApp)
 * - 5411XXXXXXXX   (sin el 9)
 * - 541115XXXXXXXX (formato viejo con 15 — el que usa el panel de Meta)
 */
function whatsappRecipientCandidates(raw) {
  const cleaned = String(raw || '').replace(/\D/g, '').replace(/^0+/, '')
  const withNine = normalizeWhatsappDigits(raw)
  const candidates = []
  const add = (d) => {
    if (d && d.length >= 10 && !candidates.includes(d)) candidates.push(d)
  }
  add(cleaned)
  add(withNine)

  // 54911XXXXXXXX (13) → 5411XXXXXXXX (12) y 541115XXXXXXXX (14)
  const modernBa = withNine.startsWith('549') ? withNine : cleaned.startsWith('549') ? cleaned : ''
  if (/^54911\d{8}$/.test(modernBa)) {
    const local8 = modernBa.slice(5) // 58896844
    add(`5411${local8}`) // 541158896844
    add(`541115${local8}`) // 54111558896844 ← formato del panel Meta
  } else if (modernBa.startsWith('549') && modernBa.length >= 13) {
    add(`54${modernBa.slice(3)}`)
  }

  if (cleaned.startsWith('54') && !cleaned.startsWith('549') && cleaned.length >= 12) {
    add(`549${cleaned.slice(2)}`)
  }
  // Si ya viene como 541115..., también probar moderno
  if (/^541115\d{8}$/.test(cleaned)) {
    add(`54911${cleaned.slice(6)}`)
  }
  return candidates
}

function normalizeAppOrigin(origin) {
  let base = String(origin || process.env.APP_ORIGIN || 'http://localhost:5180').replace(/\/$/, '')
  // Vite local is HTTP only — never emit https://localhost (causes ERR_SSL_PROTOCOL_ERROR)
  try {
    const u = new URL(base)
    const host = u.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      u.protocol = 'http:'
      if (!u.port) u.port = '5180'
      base = u.origin
    }
  } catch {
    base = 'http://localhost:5180'
  }
  return base
}

function buildDeliveryLinks({ order, event, ticketToken, origin }) {
  const base = normalizeAppOrigin(origin)
  const ticketUrl = ticketToken ? `${base}/entrada/${ticketToken}` : null
  const phone = normalizeWhatsappDigits(order.buyer_whatsapp)
  const name = `${order.buyer_name || ''} ${order.buyer_surname || ''}`.trim()
  const eventTitle = event?.title || 'tu evento'
  const tier = order.tier_name || 'entrada'
  const waText = ticketUrl
    ? `¡Hola${name ? ` ${order.buyer_name}` : ''}! Tu entrada para *${eventTitle}* (${tier}) ya está lista.\n\nReferencia: ${order.reference_code || ''}\nAbrí tu QR acá:\n${ticketUrl}`
    : ''
  const whatsappUrl = phone && ticketUrl
    ? `https://wa.me/${phone}?text=${encodeURIComponent(waText)}`
    : null
  const emailSubject = encodeURIComponent(`Tu entrada — ${eventTitle}`)
  const emailBody = encodeURIComponent(
    `Hola${name ? ` ${name}` : ''},\n\nTu entrada para ${eventTitle} (${tier}) está confirmada.\nReferencia: ${order.reference_code || ''}\n\nAbrí tu QR aquí:\n${ticketUrl || ''}\n\n¡Nos vemos!`,
  )
  const emailUrl =
    order.buyer_email && ticketUrl
      ? `mailto:${order.buyer_email}?subject=${emailSubject}&body=${emailBody}`
      : null
  return { ticketUrl, whatsappUrl, emailUrl, buyerWhatsapp: order.buyer_whatsapp || null }
}

async function ensureTicketToken(orderId, existingToken) {
  if (existingToken) return existingToken
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  await pool.query(`UPDATE event_orders SET ticket_token = $1 WHERE id = $2`, [token, orderId])
  return token
}

/**
 * Send ticket via WhatsApp Cloud API.
 * - Default: free-form text (works in the 24h window / some test setups).
 * - If WHATSAPP_TEMPLATE_NAME is set: send that template instead.
 */
/**
 * Outside the 24h customer-care window, Cloud API ONLY delivers templates (error 131047).
 * Default: hello_world (same as Meta panel). Set WHATSAPP_TEMPLATE_NAME to a custom
 * approved template with body vars {{1}} name {{2}} event {{3}} ref {{4}} ticketUrl.
 */
function buildWhatsAppPayload({ to, ticketUrl, buyerName, eventTitle, referenceCode }) {
  const templateName = (process.env.WHATSAPP_TEMPLATE_NAME || 'hello_world').trim()
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || 'en_US'

  if (templateName === 'hello_world') {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name: 'hello_world', language: { code: lang } },
      _ticketIncluded: false,
    }
  }

  return {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: lang },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: String(buyerName || 'hola').slice(0, 60) },
            { type: 'text', text: String(eventTitle || 'evento').slice(0, 60) },
            { type: 'text', text: String(referenceCode || '-').slice(0, 60) },
            { type: 'text', text: String(ticketUrl || '-').slice(0, 1024) },
          ],
        },
      ],
    },
    _ticketIncluded: true,
  }
}

async function sendWhatsAppTicket({
  toRaw,
  message,
  ticketUrl,
  buyerName,
  eventTitle,
  referenceCode,
}) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const version = process.env.WHATSAPP_API_VERSION || 'v25.0'
  if (!token || !phoneNumberId) {
    return { ok: false, skipped: true, error: 'whatsapp_not_configured' }
  }
  const candidates = whatsappRecipientCandidates(toRaw)
  if (!candidates.length) {
    return { ok: false, error: 'invalid_phone' }
  }

  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  let lastError = null
  console.log('WhatsApp trying recipients:', candidates.join(', '))

  for (const to of candidates) {
    const built = buildWhatsAppPayload({
      to,
      ticketUrl,
      buyerName,
      eventTitle,
      referenceCode,
    })
    const { _ticketIncluded, ...payload } = built
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        console.log('WhatsApp sent OK to', to, 'template', payload.template?.name)
        const ticketIncluded = Boolean(_ticketIncluded)
        return {
          ok: true,
          messageId: data?.messages?.[0]?.id || null,
          to,
          usedType: 'template',
          templateName: payload.template?.name,
          ticketIncluded,
          warning: ticketIncluded
            ? null
            : 'Llegó la plantilla de prueba (hello_world). Todavía no incluye el link del QR: creá una plantilla en Meta con variables, o usá “Abrir chat manual”.',
        }
      }
      const code = data?.error?.code
      const msg = data?.error?.message || 'whatsapp_send_failed'
      console.error('WhatsApp API error for', to, code, msg)
      lastError = {
        ok: false,
        error: msg,
        code,
        errorData: data?.error || null,
        triedTo: to,
        tried: candidates,
      }
    } catch (e) {
      console.error('WhatsApp send exception:', e?.message || e)
      lastError = { ok: false, error: e?.message || 'whatsapp_network_error', triedTo: to, tried: candidates }
    }
  }

  return (
    lastError || {
      ok: false,
      error: 'whatsapp_send_failed',
      tried: candidates,
    }
  )
}

async function deliverTicketWhatsApp({ order, event, delivery }) {
  if (!order.buyer_whatsapp) {
    return { ok: false, skipped: true, error: 'missing_whatsapp' }
  }
  const eventTitle = event?.title || 'tu evento'
  const tier = order.tier_name || 'entrada'
  const message =
    `¡Hola ${order.buyer_name || ''}! Tu entrada para *${eventTitle}* (${tier}) ya está confirmada.\n\n` +
    `Referencia: ${order.reference_code || ''}\n` +
    `Abrí tu QR acá:\n${delivery.ticketUrl || ''}`

  return sendWhatsAppTicket({
    toRaw: order.buyer_whatsapp,
    message,
    ticketUrl: delivery.ticketUrl,
    buyerName: order.buyer_name,
    eventTitle,
    referenceCode: order.reference_code,
  })
}

async function issueAttendeeForPurchase({
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  tierId,
  tierName,
  buyerName,
  buyerSurname,
  amountCents,
  currency,
  referenceCode,
  buyerEmail,
  buyerWhatsapp,
}) {
  const attendeeId = crypto.randomUUID()
  const fullName = `${buyerName} ${buyerSurname || ''}`.trim()
  await pool.query(
    `INSERT INTO event_attendees (id, event_id, full_name, name, surname, label, source, verified)
     VALUES ($1,$2,$3,$4,$5,$6,'purchase','false')`,
    [attendeeId, eventId, fullName, String(buyerName), buyerSurname ? String(buyerSurname) : null, tierName],
  )
  await pool.query(
    `UPDATE event_tiers
     SET sold = ((COALESCE(NULLIF(sold,''),'0'))::int + 1)::text
     WHERE id = $1`,
    [tierId],
  )
  const qrPayload = buildTicketQrPayload({
    eventId,
    eventTitle,
    eventDate,
    eventLocation,
    attendeeId,
    buyerName,
    buyerSurname,
    tierName,
    amountCents,
    currency,
    referenceCode,
    buyerEmail,
    buyerWhatsapp,
  })
  return { attendeeId, qrData: JSON.stringify(qrPayload), ticket: qrPayload }
}

app.get('/api/events', async (req, res) => {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined
    if (!token) return res.status(401).json({ ok: false, error: 'missing_token' })
    const payload = await verifyIdToken(token)
    const userId = String(payload.sub)
    const name = String(payload.name || '')
    const email = String(payload.email || '')
    const picture = String(payload.picture || '')
    // upsert user
    await pool.query(
      `INSERT INTO users (id, name, email, picture)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, picture = EXCLUDED.picture`,
      [userId, name, email, picture],
    )

    const { rows } = await pool.query(
      'SELECT id, title, date, location, description, status, public_slug AS "publicSlug", published, owner_id AS "ownerId", created_at AS "createdAt" FROM events WHERE owner_id = $1 ORDER BY created_at DESC',
      [userId],
    )
    res.json({ ok: true, events: rows })
  } catch (e) {
    sendError(res, e)
  }
})

app.post('/api/events', async (req, res) => {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined
    if (!token) return res.status(401).json({ ok: false, error: 'missing_token' })
    const payload = await verifyIdToken(token)
    const userId = String(payload.sub)
    const name = String(payload.name || '')
    const email = String(payload.email || '')
    const picture = String(payload.picture || '')
    // upsert user
    await pool.query(
      `INSERT INTO users (id, name, email, picture)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, picture = EXCLUDED.picture`,
      [userId, name, email, picture],
    )

    const { title, date, location, description } = req.body || {}
    if (!title || !date || !location) {
      return res.status(400).json({ ok: false, error: 'missing_fields' })
    }
    const id = crypto.randomUUID()
    await pool.query(
      'INSERT INTO events (id, title, date, location, description, status, owner_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, String(title), String(date), String(location), description ? String(description) : null, 'draft', userId],
    )
    res.status(201).json({ ok: true, id })
  } catch (e) {
    sendError(res, e)
  }
})

// Middleware to load and authorize event
async function ensureEventOwnership(req, res, next) {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined
    if (!token) return res.status(401).json({ ok: false, error: 'missing_token' })
    const payload = await verifyIdToken(token)
    const userId = String(payload.sub)
    const { id } = req.params
    const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [id])
    if (!rows[0]) return res.status(404).json({ ok: false, error: 'event_not_found' })
    if (rows[0].owner_id !== userId) return res.status(403).json({ ok: false, error: 'forbidden' })
    req.userId = userId
    req.event = rows[0]
    next()
  } catch (e) {
    sendError(res, e)
  }
}

// Get single event
app.get('/api/events/:id', ensureEventOwnership, async (req, res) => {
  const e = req.event
  res.json({
    ok: true,
    event: {
      id: e.id,
      title: e.title,
      date: e.date,
      location: e.location,
      description: e.description,
      status: e.status,
      publicSlug: e.public_slug,
      published: e.published === 'true',
      coverImage: e.cover_image,
      createdAt: e.created_at,
    },
  })
})

// Tiers
app.get('/api/events/:id/tiers', ensureEventOwnership, async (req, res) => {
  const { id } = req.params
  const { rows } = await pool.query(
    `SELECT id, event_id AS "eventId", name, price_cents AS "priceCents", currency, quantity, sold,
            sales_start AS "salesStart", sales_end AS "salesEnd", per_buyer_limit AS "perBuyerLimit",
            visibility, sort_order AS "sortOrder", mp_checkout_url AS "mpCheckoutUrl", created_at AS "createdAt"
     FROM event_tiers WHERE event_id = $1 ORDER BY sort_order::int ASC, created_at DESC`,
    [id],
  )
  res.json({ ok: true, tiers: rows })
})

app.post('/api/events/:id/tiers', ensureEventOwnership, async (req, res) => {
  const { id } = req.params
  const { name, price, currency = 'ARS', quantity = 0, perBuyerLimit, salesStart, salesEnd, visibility = 'public', sortOrder = 0 } =
    req.body || {}
  if (!name) return res.status(400).json({ ok: false, error: 'missing_name' })
  const priceCents =
    typeof price === 'number'
      ? Math.round(price * 100)
      : Math.round(parseFloat(String(price || 0)) * 100)
  const tid = crypto.randomUUID()
  await pool.query(
    `INSERT INTO event_tiers (id, event_id, name, price_cents, currency, quantity, sold, sales_start, sales_end, per_buyer_limit, visibility, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,'0',$7,$8,$9,$10,$11)`,
    [
      tid,
      id,
      String(name),
      String(priceCents),
      String(currency),
      String(quantity),
      salesStart ? new Date(salesStart) : null,
      salesEnd ? new Date(salesEnd) : null,
      perBuyerLimit ? String(perBuyerLimit) : null,
      String(visibility),
      String(sortOrder),
    ],
  )
  res.status(201).json({ ok: true, id: tid })
})

app.patch('/api/events/:id/tiers/:tierId', ensureEventOwnership, async (req, res) => {
  try {
    const { tierId } = req.params
    const { mpCheckoutUrl, visibility } = req.body || {}
    const { rows } = await pool.query(
      'SELECT id, mp_checkout_url, visibility FROM event_tiers WHERE id = $1 AND event_id = $2',
      [tierId, req.event.id],
    )
    if (!rows[0]) return res.status(404).json({ ok: false, error: 'tier_not_found' })

    const updates = []
    const params = []
    let idx = 1

    if (mpCheckoutUrl !== undefined) {
      updates.push(`mp_checkout_url = $${idx++}`)
      params.push(
        mpCheckoutUrl != null && String(mpCheckoutUrl).trim()
          ? String(mpCheckoutUrl).trim()
          : null,
      )
    }
    if (visibility !== undefined) {
      const v = String(visibility) === 'public' ? 'public' : 'hidden'
      updates.push(`visibility = $${idx++}`)
      params.push(v)
    }
    if (!updates.length) return res.json({ ok: true })

    params.push(tierId)
    await pool.query(
      `UPDATE event_tiers SET ${updates.join(', ')} WHERE id = $${idx}`,
      params,
    )
    res.json({ ok: true })
  } catch (e) {
    sendError(res, e)
  }
})

// Free passes
app.get('/api/events/:id/free-passes', ensureEventOwnership, async (req, res) => {
  const { id } = req.params
  const { rows } = await pool.query(
    `SELECT id,
            event_id AS "eventId",
            code,
            issued_by_user_id AS "issuedByUserId",
            note,
            beneficiary_name AS "beneficiaryName",
            beneficiary_surname AS "beneficiarySurname",
            assigned_at AS "assignedAt",
            expires_at AS "expiresAt",
            redeemed::bool AS redeemed,
            redeemed_at AS "redeemedAt",
            created_at AS "createdAt"
     FROM guest_passes WHERE event_id = $1 ORDER BY created_at DESC LIMIT 200`,
    [id],
  )
  res.json({ ok: true, passes: rows })
})

app.post('/api/events/:id/free-passes', ensureEventOwnership, async (req, res) => {
  const { id } = req.params
  const { count = 1, note, expiresAt } = req.body || {}
  const n = Math.max(1, Math.min(100, Number(count)))
  const values = []
  for (let i = 0; i < n; i++) {
    const pid = crypto.randomUUID()
    const code = pid.split('-')[0] + Math.random().toString(36).slice(2, 8).toUpperCase()
    values.push([pid, id, code, req.userId, note ? String(note) : null, expiresAt ? new Date(expiresAt) : null])
  }
  const params = values.flat()
  const placeholders = values.map((_, i) => `($${i * 6 + 1},$${i * 6 + 2},$${i * 6 + 3},$${i * 6 + 4},$${i * 6 + 5},$${i * 6 + 6})`).join(',')
  await pool.query(
    `INSERT INTO guest_passes (id, event_id, code, issued_by_user_id, note, expires_at) VALUES ${placeholders}`,
    params,
  )
  res.status(201).json({ ok: true, created: n })
})

// Ownership by pass id
async function ensurePassOwnership(req, res, next) {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined
    if (!token) return res.status(401).json({ ok: false, error: 'missing_token' })
    const payload = await verifyIdToken(token)
    const userId = String(payload.sub)
    const { id } = req.params
    const { rows } = await pool.query(
      `SELECT gp.*, e.owner_id
       FROM guest_passes gp
       JOIN events e ON e.id = gp.event_id
       WHERE gp.id = $1
      `,
      [id],
    )
    const pass = rows[0]
    if (!pass) return res.status(404).json({ ok: false, error: 'pass_not_found' })
    if (pass.owner_id !== userId) return res.status(403).json({ ok: false, error: 'forbidden' })
    req.userId = userId
    req.pass = pass
    next()
  } catch (e) {
    sendError(res, e)
  }
}

// Assign beneficiary and return QR data
app.post('/api/free-passes/:id/assign', ensurePassOwnership, async (req, res) => {
  try {
    const { beneficiaryName, beneficiarySurname } = req.body || {}
    if (!beneficiaryName || !beneficiarySurname) {
      return res.status(400).json({ ok: false, error: 'missing_beneficiary' })
    }
    const id = req.params.id
    await pool.query(
      `UPDATE guest_passes
       SET beneficiary_name = $1, beneficiary_surname = $2, assigned_at = NOW()
       WHERE id = $3`,
      [String(beneficiaryName), String(beneficiarySurname), id],
    )
    const fullName = `${beneficiaryName} ${beneficiarySurname}`.trim()
    const qrPayload = {
      type: 'FREE_PASS',
      eventId: req.pass.event_id,
      passId: id,
      name: fullName,
      note: req.pass.note || '',
    }
    // upsert attendee
    const label = `Free Pass · ${req.pass.note || 'General'}`
    await pool.query(
      `INSERT INTO event_attendees (id, event_id, full_name, name, surname, label, source, verified)
       VALUES ($1,$2,$3,$4,$5,$6,'free_pass','false')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, name = EXCLUDED.name, surname = EXCLUDED.surname, label = EXCLUDED.label`,
      [id, req.pass.event_id, fullName, String(beneficiaryName), String(beneficiarySurname), label],
    )
    return res.status(200).json({ ok: true, qrData: JSON.stringify(qrPayload) })
  } catch (e) {
    sendError(res, e)
  }
})

// Attendees endpoints
app.get('/api/events/:id/attendees', ensureEventOwnership, async (req, res) => {
  const { id } = req.params
  // Backfill: create attendees from already-assigned free passes if missing
  await pool.query(
    `INSERT INTO event_attendees (id, event_id, full_name, name, surname, label, source, verified, created_at)
     SELECT gp.id,
            gp.event_id,
            TRIM(COALESCE(gp.beneficiary_name,'') || ' ' || COALESCE(gp.beneficiary_surname,'')) AS full_name,
            gp.beneficiary_name,
            gp.beneficiary_surname,
            'Free Pass · ' || COALESCE(gp.note,'General') AS label,
            'free_pass' AS source,
            'false' AS verified,
            NOW() AS created_at
     FROM guest_passes gp
     WHERE gp.event_id = $1
       AND (gp.beneficiary_name IS NOT NULL OR gp.beneficiary_surname IS NOT NULL)
       AND NOT EXISTS (SELECT 1 FROM event_attendees ea WHERE ea.id = gp.id)`,
    [id],
  )
  const { rows } = await pool.query(
    `SELECT id, event_id AS "eventId", full_name AS "fullName", name, surname, label,
            source, verified::bool AS verified, verified_at AS "verifiedAt", created_at AS "createdAt"
     FROM event_attendees WHERE event_id = $1 ORDER BY created_at DESC LIMIT 500`,
    [id],
  )
  res.json({ ok: true, attendees: rows })
})

app.post('/api/events/:id/attendees/verify', ensureEventOwnership, async (req, res) => {
  const { attendeeId } = req.body || {}
  if (!attendeeId) return res.status(400).json({ ok: false, error: 'missing_attendee_id' })
  const { rows } = await pool.query(
    `UPDATE event_attendees
     SET verified = 'true', verified_at = NOW()
     WHERE id = $1 AND event_id = $2
     RETURNING id, full_name AS "fullName", label, source, verified::bool AS verified, verified_at AS "verifiedAt"`,
    [attendeeId, req.event.id],
  )
  if (!rows[0]) return res.status(404).json({ ok: false, error: 'attendee_not_found' })
  res.json({ ok: true, attendee: rows[0] })
})

/** Door control: validate QR / attendee for this event and optionally check in */
app.post('/api/events/:id/door/check', ensureEventOwnership, async (req, res) => {
  try {
    const eventId = req.event.id
    const { qrData, attendeeId: bodyAttendeeId, checkIn = true } = req.body || {}

    let attendeeId = bodyAttendeeId ? String(bodyAttendeeId) : null
    let parsed = null

    if (!attendeeId && qrData) {
      const raw = String(qrData).trim()
      try {
        parsed = JSON.parse(raw)
      } catch {
        return res.status(400).json({ ok: false, error: 'invalid_qr', message: 'El QR no es una entrada válida de TicketFest.' })
      }
      if (parsed.eventId && String(parsed.eventId) !== String(eventId)) {
        return res.status(400).json({
          ok: false,
          error: 'wrong_event',
          message: 'Este QR pertenece a otro evento.',
        })
      }
      attendeeId = parsed.attendeeId ? String(parsed.attendeeId) : null
    }

    if (!attendeeId) {
      return res.status(400).json({ ok: false, error: 'missing_attendee', message: 'No se encontró el asistente en el QR.' })
    }

    const { rows } = await pool.query(
      `SELECT id, event_id AS "eventId", full_name AS "fullName", name, surname, label,
              source, verified::bool AS verified, verified_at AS "verifiedAt"
       FROM event_attendees
       WHERE id = $1 AND event_id = $2`,
      [attendeeId, eventId],
    )
    const attendee = rows[0]
    if (!attendee) {
      return res.status(404).json({
        ok: false,
        error: 'not_found',
        message: 'Entrada no encontrada para este evento.',
      })
    }

    if (attendee.verified) {
      return res.json({
        ok: true,
        status: 'already_checked_in',
        message: 'Ya ingresó anteriormente.',
        attendee,
        ticket: parsed,
      })
    }

    if (checkIn) {
      const { rows: updated } = await pool.query(
        `UPDATE event_attendees
         SET verified = 'true', verified_at = NOW()
         WHERE id = $1 AND event_id = $2
         RETURNING id, event_id AS "eventId", full_name AS "fullName", name, surname, label,
                   source, verified::bool AS verified, verified_at AS "verifiedAt"`,
        [attendeeId, eventId],
      )
      return res.json({
        ok: true,
        status: 'checked_in',
        message: 'Ingreso válido.',
        attendee: updated[0],
        ticket: parsed,
      })
    }

    res.json({
      ok: true,
      status: 'valid',
      message: 'Entrada válida (sin check-in).',
      attendee,
      ticket: parsed,
    })
  } catch (e) {
    sendError(res, e)
  }
})

app.get('/api/events/:id/door/summary', ensureEventOwnership, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE verified = 'true')::int AS checked_in,
              COUNT(*) FILTER (WHERE source = 'purchase')::int AS purchase,
              COUNT(*) FILTER (WHERE source = 'issued')::int AS issued,
              COUNT(*) FILTER (WHERE source = 'free_pass')::int AS free_pass
       FROM event_attendees
       WHERE event_id = $1`,
      [req.event.id],
    )
    const s = rows[0] || { total: 0, checked_in: 0, purchase: 0, issued: 0, free_pass: 0 }
    res.json({
      ok: true,
      summary: {
        total: s.total,
        checkedIn: s.checked_in,
        pending: s.total - s.checked_in,
        purchase: s.purchase,
        issued: s.issued,
        freePass: s.free_pass,
      },
      event: {
        id: req.event.id,
        title: req.event.title,
        date: req.event.date,
        location: req.event.location,
      },
    })
  } catch (e) {
    sendError(res, e)
  }
})

// Issue a standard ticket (creates attendee linked to a tier)
app.post('/api/events/:id/issue', ensureEventOwnership, async (req, res) => {
  try {
    const { id } = req.params
    const { beneficiaryName, beneficiarySurname, tierId } = req.body || {}
    if (!beneficiaryName || !tierId) return res.status(400).json({ ok: false, error: 'missing_fields' })
    // Fetch tier and validate it belongs to event
    const t = await pool.query(
      `SELECT id, event_id, name FROM event_tiers WHERE id = $1 AND event_id = $2`,
      [String(tierId), id],
    )
    const tier = t.rows[0]
    if (!tier) return res.status(400).json({ ok: false, error: 'invalid_tier' })
    const attendeeId = crypto.randomUUID()
    const fullName = `${beneficiaryName} ${beneficiarySurname || ''}`.trim()
    const label = tier.name
    await pool.query(
      `INSERT INTO event_attendees (id, event_id, full_name, name, surname, label, source, verified)
       VALUES ($1,$2,$3,$4,$5,$6,'issued','false')`,
      [attendeeId, id, fullName, String(beneficiaryName), beneficiarySurname ? String(beneficiarySurname) : null, label],
    )
    // increment tier sold counter (stored as text)
    await pool.query(
      `UPDATE event_tiers
       SET sold = ((COALESCE(NULLIF(sold,''),'0'))::int + 1)::text
       WHERE id = $1`,
      [tier.id],
    )
    const qrPayload = {
      type: 'TICKET',
      eventId: id,
      attendeeId,
      name: fullName,
      tier: label,
    }
    res.status(201).json({ ok: true, attendeeId, qrData: JSON.stringify(qrPayload) })
  } catch (e) {
    sendError(res, e)
  }
})

async function ensureAttendeeOwnership(req, res, next) {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined
    if (!token) return res.status(401).json({ ok: false, error: 'missing_token' })
    const payload = await verifyIdToken(token)
    const userId = String(payload.sub)
    const { attendeeId } = req.params
    const { rows } = await pool.query(
      `SELECT ea.*, e.owner_id
       FROM event_attendees ea
       JOIN events e ON e.id = ea.event_id
       WHERE ea.id = $1`,
      [attendeeId],
    )
    const a = rows[0]
    if (!a) return res.status(404).json({ ok: false, error: 'attendee_not_found' })
    if (a.owner_id !== userId) return res.status(403).json({ ok: false, error: 'forbidden' })
    req.attendee = a
    next()
  } catch (e) {
    sendError(res, e)
  }
}

app.patch('/api/attendees/:attendeeId', ensureAttendeeOwnership, async (req, res) => {
  const { fullName, label } = req.body || {}
  const updates = []
  const params = []
  let idx = 1
  if (fullName) {
    updates.push(`full_name = $${idx++}`)
    params.push(String(fullName))
  }
  if (label) {
    updates.push(`label = $${idx++}`)
    params.push(String(label))
  }
  if (updates.length === 0) return res.json({ ok: true })
  params.push(req.attendee.id)
  await pool.query(`UPDATE event_attendees SET ${updates.join(', ')} WHERE id = $${idx}`, params)
  res.json({ ok: true })
})

app.delete('/api/attendees/:attendeeId', ensureAttendeeOwnership, async (req, res) => {
  // If attendee came from a free pass, free the pass
  if (req.attendee.source === 'free_pass') {
    await pool.query(
      `UPDATE guest_passes
       SET beneficiary_name = NULL,
           beneficiary_surname = NULL,
           assigned_at = NULL
       WHERE id = $1`,
      [req.attendee.id],
    )
  }
  await pool.query(`DELETE FROM event_attendees WHERE id = $1`, [req.attendee.id])
  res.json({ ok: true })
})

// ─── Public event store (no auth) ───
app.get('/api/public/events/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const { rows } = await pool.query(
      `SELECT id, title, date, location, description, cover_image AS "coverImage"
       FROM events WHERE public_slug = $1 AND published = 'true'`,
      [slug],
    )
    const event = rows[0]
    if (!event) return res.status(404).json({ ok: false, error: 'not_found' })

    const { rows: tiers } = await pool.query(
      `SELECT id, name, price_cents AS "priceCents", currency, quantity, sold, mp_checkout_url AS "mpCheckoutUrl"
       FROM event_tiers WHERE event_id = $1 AND visibility = 'public'
       ORDER BY sort_order::int ASC, created_at ASC`,
      [event.id],
    )

    const publicTiers = tiers
      .map((t) => {
        const qty = Number(t.quantity || 0)
        const sold = Number(t.sold || 0)
        const remaining = qty > 0 ? Math.max(0, qty - sold) : null
        const soldOut = qty > 0 && sold >= qty
        return {
          id: t.id,
          name: t.name,
          priceCents: Number(t.priceCents || 0),
          currency: t.currency,
          remaining,
          soldOut,
          mpCheckoutUrl: t.mpCheckoutUrl || null,
        }
      })
      .filter((t) => !t.soldOut)

    const { rows: methods } = await pool.query(
      `SELECT id, type, label, config
       FROM event_payment_methods WHERE event_id = $1 AND enabled = 'true'
       ORDER BY sort_order::int ASC, created_at ASC`,
      [event.id],
    )

    res.json({
      ok: true,
      event,
      tiers: publicTiers,
      paymentMethods: methods.map((m) => ({
        id: m.id,
        type: m.type,
        label: m.label,
        config: parseJsonConfig(m.config),
      })),
    })
  } catch (e) {
    sendError(res, e)
  }
})

app.get('/api/public/tickets/:token', async (req, res) => {
  try {
    const token = String(req.params.token || '').trim()
    if (!token) return res.status(400).json({ ok: false, error: 'missing_token' })
    const { rows } = await pool.query(
      `SELECT o.*, t.name AS tier_name,
              e.title AS event_title, e.date AS event_date, e.location AS event_location, e.id AS event_id
       FROM event_orders o
       JOIN event_tiers t ON t.id = o.tier_id
       JOIN events e ON e.id = o.event_id
       WHERE o.ticket_token = $1`,
      [token],
    )
    const order = rows[0]
    if (!order) return res.status(404).json({ ok: false, error: 'not_found' })
    if (order.status !== 'paid' || !order.attendee_id) {
      return res.json({
        ok: true,
        status: order.status,
        pending: true,
        message: 'Tu pago aún no fue confirmado. Cuando se confirme, vas a ver tu QR acá.',
        referenceCode: order.reference_code,
        eventTitle: order.event_title,
        tierName: order.tier_name,
      })
    }
    const event = {
      title: order.event_title,
      date: order.event_date,
      location: order.event_location,
    }
    const { ticket, qrData } = ticketFromOrder(order, { ...event, id: order.event_id, title: order.event_title })
    res.json({
      ok: true,
      status: 'paid',
      pending: false,
      qrData,
      ticket,
      referenceCode: order.reference_code,
      eventTitle: order.event_title,
      eventDate: order.event_date,
      eventLocation: order.event_location,
      tierName: order.tier_name,
      buyerName: order.buyer_name,
      buyerSurname: order.buyer_surname,
      amountCents: Number(order.amount_cents),
      currency: order.currency,
    })
  } catch (e) {
    sendError(res, e)
  }
})

app.post('/api/public/events/:slug/checkout', async (req, res) => {
  try {
    const { slug } = req.params
    const { tierId, paymentMethodId, buyerName, buyerSurname, buyerEmail, buyerDni, buyerWhatsapp } =
      req.body || {}
    if (!tierId || !paymentMethodId || !buyerName?.trim() || !buyerEmail?.trim() || !buyerWhatsapp?.trim()) {
      return res.status(400).json({ ok: false, error: 'missing_fields' })
    }

    const whatsappDigits = normalizeWhatsappDigits(buyerWhatsapp)
    if (!whatsappDigits || whatsappDigits.length < 10) {
      return res.status(400).json({ ok: false, error: 'invalid_whatsapp' })
    }

    const { rows: events } = await pool.query(
      `SELECT id, title FROM events WHERE public_slug = $1 AND published = 'true'`,
      [slug],
    )
    const event = events[0]
    if (!event) return res.status(404).json({ ok: false, error: 'not_found' })

    const { rows: tiers } = await pool.query(
      `SELECT id, name, price_cents, currency, quantity, sold, mp_checkout_url
       FROM event_tiers WHERE id = $1 AND event_id = $2 AND visibility = 'public'`,
      [String(tierId), event.id],
    )
    const tier = tiers[0]
    if (!tier) return res.status(400).json({ ok: false, error: 'invalid_tier' })

    const qty = Number(tier.quantity || 0)
    const sold = Number(tier.sold || 0)
    if (qty > 0 && sold >= qty) {
      return res.status(400).json({ ok: false, error: 'tier_sold_out' })
    }

    const { rows: methods } = await pool.query(
      `SELECT id, type, label, config FROM event_payment_methods
       WHERE id = $1 AND event_id = $2 AND enabled = 'true'`,
      [String(paymentMethodId), event.id],
    )
    const method = methods[0]
    if (!method) return res.status(400).json({ ok: false, error: 'invalid_payment_method' })

    const orderId = crypto.randomUUID()
    const referenceCode = orderId.split('-')[0].toUpperCase()
    const ticketToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    const config = parseJsonConfig(method.config)

    await pool.query(
      `INSERT INTO event_orders
       (id, event_id, tier_id, buyer_name, buyer_surname, buyer_email, buyer_dni, buyer_whatsapp,
        payment_method_id, payment_method_type, status, amount_cents, currency, reference_code, ticket_token)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending_payment',$11,$12,$13,$14)`,
      [
        orderId,
        event.id,
        tier.id,
        String(buyerName).trim(),
        buyerSurname ? String(buyerSurname).trim() : null,
        String(buyerEmail).trim(),
        buyerDni ? String(buyerDni).trim() : null,
        String(buyerWhatsapp).trim(),
        method.id,
        method.type,
        String(tier.price_cents),
        tier.currency,
        referenceCode,
        ticketToken,
      ],
    )

    const response = {
      ok: true,
      orderId,
      referenceCode,
      paymentType: method.type,
      paymentLabel: method.label,
      amountCents: Number(tier.price_cents),
      currency: tier.currency,
      tierName: tier.name,
      eventTitle: event.title,
    }

    if (method.type === 'mercadopago') {
      response.redirectUrl = tier.mp_checkout_url || config.checkoutUrl || config.url || null
      if (!response.redirectUrl) {
        return res.status(400).json({ ok: false, error: 'mp_link_not_configured_for_tier' })
      }
    } else if (method.type === 'transfer') {
      response.transfer = {
        bankName: config.bankName || '',
        cbu: config.cbu || '',
        alias: config.alias || '',
        holderName: config.holderName || '',
        instructions: config.instructions || 'Enviá el comprobante indicando el código de referencia.',
      }
    } else if (method.type === 'cash') {
      response.cash = {
        instructions: config.instructions || 'Acercate a boletería para completar el pago.',
      }
    }

    const origin = normalizeAppOrigin(
      req.get('origin') || process.env.APP_ORIGIN || 'http://localhost:5180',
    )
    response.ticketUrl = `${origin}/entrada/${ticketToken}`

    res.status(201).json(response)
  } catch (e) {
    sendError(res, e)
  }
})

// ─── Organizer store config ───
app.get('/api/events/:id/store', ensureEventOwnership, async (req, res) => {
  const e = req.event
  const { rows: methods } = await pool.query(
    `SELECT id, type, label, config, enabled, sort_order AS "sortOrder", created_at AS "createdAt"
     FROM event_payment_methods WHERE event_id = $1 ORDER BY sort_order::int ASC, created_at ASC`,
    [e.id],
  )
  const { rows: orderStats } = await pool.query(
    `SELECT status, COUNT(*)::int AS count FROM event_orders WHERE event_id = $1 GROUP BY status`,
    [e.id],
  )
  res.json({
    ok: true,
    store: {
      publicSlug: e.public_slug,
      published: e.published === 'true',
      coverImage: e.cover_image,
      publicUrl: e.public_slug ? `/e/${e.public_slug}` : null,
    },
    paymentMethods: methods.map((m) => ({
      id: m.id,
      type: m.type,
      label: m.label,
      config: parseJsonConfig(m.config),
      enabled: m.enabled === 'true',
      sortOrder: Number(m.sortOrder || 0),
      createdAt: m.createdAt,
    })),
    orderStats: orderStats.reduce((acc, r) => {
      acc[r.status] = r.count
      return acc
    }, {}),
  })
})

app.put('/api/events/:id/store', ensureEventOwnership, async (req, res) => {
  try {
    const e = req.event
    const { published, coverImage, publicSlug } = req.body || {}
    let slug = e.public_slug

    if (published === true && !slug) {
      slug = await ensureUniqueSlug(e.title, e.id)
    }
    if (publicSlug && typeof publicSlug === 'string') {
      const candidate = slugify(publicSlug)
      const { rows: taken } = await pool.query(
        'SELECT id FROM events WHERE public_slug = $1 AND id != $2',
        [candidate, e.id],
      )
      if (taken.length) return res.status(409).json({ ok: false, error: 'slug_taken' })
      slug = candidate
    }

    const nextCover =
      coverImage === undefined
        ? e.cover_image
        : coverImage
          ? String(coverImage)
          : null

    await pool.query(
      `UPDATE events SET published = $1, cover_image = $2, public_slug = $3 WHERE id = $4`,
      [
        published === true ? 'true' : published === false ? 'false' : e.published,
        nextCover,
        slug,
        e.id,
      ],
    )

    res.json({
      ok: true,
      publicSlug: slug,
      published: published === true || (published !== false && e.published === 'true'),
      publicUrl: slug ? `/e/${slug}` : null,
    })
  } catch (e) {
    sendError(res, e)
  }
})

app.post('/api/events/:id/payment-methods', ensureEventOwnership, async (req, res) => {
  try {
    const { type, label, config, enabled = true, sortOrder = 0 } = req.body || {}
    if (!type || !label) return res.status(400).json({ ok: false, error: 'missing_fields' })
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO event_payment_methods (id, event_id, type, label, config, enabled, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        id,
        req.event.id,
        String(type),
        String(label),
        config ? JSON.stringify(config) : null,
        enabled ? 'true' : 'false',
        String(sortOrder),
      ],
    )
    res.status(201).json({ ok: true, id })
  } catch (e) {
    sendError(res, e)
  }
})

app.patch('/api/events/:id/payment-methods/:pmId', ensureEventOwnership, async (req, res) => {
  try {
    const { pmId } = req.params
    const { label, config, enabled, sortOrder } = req.body || {}
    const { rows } = await pool.query(
      'SELECT id FROM event_payment_methods WHERE id = $1 AND event_id = $2',
      [pmId, req.event.id],
    )
    if (!rows[0]) return res.status(404).json({ ok: false, error: 'not_found' })

    const updates = []
    const params = []
    let idx = 1
    if (label != null) {
      updates.push(`label = $${idx++}`)
      params.push(String(label))
    }
    if (config != null) {
      updates.push(`config = $${idx++}`)
      params.push(JSON.stringify(config))
    }
    if (enabled != null) {
      updates.push(`enabled = $${idx++}`)
      params.push(enabled ? 'true' : 'false')
    }
    if (sortOrder != null) {
      updates.push(`sort_order = $${idx++}`)
      params.push(String(sortOrder))
    }
    if (!updates.length) return res.json({ ok: true })
    params.push(pmId)
    await pool.query(`UPDATE event_payment_methods SET ${updates.join(', ')} WHERE id = $${idx}`, params)
    res.json({ ok: true })
  } catch (e) {
    sendError(res, e)
  }
})

app.delete('/api/events/:id/payment-methods/:pmId', ensureEventOwnership, async (req, res) => {
  const { pmId } = req.params
  await pool.query('DELETE FROM event_payment_methods WHERE id = $1 AND event_id = $2', [
    pmId,
    req.event.id,
  ])
  res.json({ ok: true })
})

app.get('/api/events/:id/orders', ensureEventOwnership, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.id, o.buyer_name AS "buyerName", o.buyer_surname AS "buyerSurname",
            o.buyer_email AS "buyerEmail", o.buyer_whatsapp AS "buyerWhatsapp",
            o.status, o.amount_cents AS "amountCents",
            o.currency, o.reference_code AS "referenceCode", o.payment_method_type AS "paymentMethodType",
            o.created_at AS "createdAt", o.paid_at AS "paidAt", o.attendee_id AS "attendeeId",
            o.ticket_token AS "ticketToken",
            t.name AS "tierName"
     FROM event_orders o
     JOIN event_tiers t ON t.id = o.tier_id
     WHERE o.event_id = $1
     ORDER BY o.created_at DESC
     LIMIT 100`,
    [req.event.id],
  )
  res.json({ ok: true, orders: rows })
})

function ticketFromOrder(order, event) {
  const ticket = buildTicketQrPayload({
    eventId: order.event_id || event.id,
    eventTitle: event.title || order.event_title,
    eventDate: event.date || order.event_date,
    eventLocation: event.location || order.event_location,
    attendeeId: order.attendee_id,
    buyerName: order.buyer_name,
    buyerSurname: order.buyer_surname,
    tierName: order.tier_name,
    amountCents: order.amount_cents,
    currency: order.currency,
    referenceCode: order.reference_code,
    buyerEmail: order.buyer_email,
    buyerWhatsapp: order.buyer_whatsapp,
  })
  return { ticket, qrData: JSON.stringify(ticket) }
}

function deliveryFromRequest(req, order, event, ticketToken) {
  const origin = normalizeAppOrigin(
    req.get('x-app-origin') ||
      req.get('origin') ||
      process.env.APP_ORIGIN ||
      'http://localhost:5180',
  )
  return buildDeliveryLinks({ order, event, ticketToken, origin })
}

app.get('/api/events/:id/orders/:orderId/ticket', ensureEventOwnership, async (req, res) => {
  try {
    const { orderId } = req.params
    const { rows } = await pool.query(
      `SELECT o.*, t.name AS tier_name
       FROM event_orders o
       JOIN event_tiers t ON t.id = o.tier_id
       WHERE o.id = $1 AND o.event_id = $2`,
      [orderId, req.event.id],
    )
    const order = rows[0]
    if (!order) return res.status(404).json({ ok: false, error: 'order_not_found' })
    if (order.status !== 'paid' || !order.attendee_id) {
      return res.status(400).json({ ok: false, error: 'order_not_paid' })
    }
    const ticketToken = await ensureTicketToken(order.id, order.ticket_token)
    const { ticket, qrData } = ticketFromOrder(order, req.event)
    const delivery = deliveryFromRequest(req, order, req.event, ticketToken)
    res.json({
      ok: true,
      attendeeId: order.attendee_id,
      qrData,
      ticket,
      ...delivery,
      buyerEmail: order.buyer_email,
      buyerWhatsapp: order.buyer_whatsapp,
    })
  } catch (e) {
    sendError(res, e)
  }
})

app.post('/api/events/:id/orders/:orderId/confirm', ensureEventOwnership, async (req, res) => {
  try {
    const { orderId } = req.params
    const { rows } = await pool.query(
      `SELECT o.*, t.name AS tier_name
       FROM event_orders o
       JOIN event_tiers t ON t.id = o.tier_id
       WHERE o.id = $1 AND o.event_id = $2`,
      [orderId, req.event.id],
    )
    const order = rows[0]
    if (!order) return res.status(404).json({ ok: false, error: 'order_not_found' })

    if (order.status === 'paid' && order.attendee_id) {
      const ticketToken = await ensureTicketToken(order.id, order.ticket_token)
      const { ticket, qrData } = ticketFromOrder(order, req.event)
      const delivery = deliveryFromRequest(req, order, req.event, ticketToken)
      let whatsappAuto = null
      if (req.body?.resendWhatsapp) {
        whatsappAuto = await deliverTicketWhatsApp({ order, event: req.event, delivery })
      }
      return res.json({
        ok: true,
        alreadyPaid: true,
        attendeeId: order.attendee_id,
        qrData,
        ticket,
        ...delivery,
        buyerEmail: order.buyer_email,
        buyerWhatsapp: order.buyer_whatsapp,
        whatsappAuto,
      })
    }

    const { attendeeId, qrData, ticket } = await issueAttendeeForPurchase({
      eventId: order.event_id,
      eventTitle: req.event.title,
      eventDate: req.event.date,
      eventLocation: req.event.location,
      tierId: order.tier_id,
      tierName: order.tier_name,
      buyerName: order.buyer_name,
      buyerSurname: order.buyer_surname,
      amountCents: order.amount_cents,
      currency: order.currency,
      referenceCode: order.reference_code,
      buyerEmail: order.buyer_email,
      buyerWhatsapp: order.buyer_whatsapp,
    })

    const ticketToken = await ensureTicketToken(order.id, order.ticket_token)

    await pool.query(
      `UPDATE event_orders SET status = 'paid', paid_at = NOW(), attendee_id = $1 WHERE id = $2`,
      [attendeeId, orderId],
    )

    const orderPaid = { ...order, attendee_id: attendeeId }
    const delivery = deliveryFromRequest(req, orderPaid, req.event, ticketToken)
    const whatsappAuto = await deliverTicketWhatsApp({
      order: orderPaid,
      event: req.event,
      delivery,
    })

    res.json({
      ok: true,
      attendeeId,
      qrData,
      ticket,
      ...delivery,
      buyerEmail: order.buyer_email,
      buyerWhatsapp: order.buyer_whatsapp,
      whatsappAuto,
    })
  } catch (e) {
    sendError(res, e)
  }
})

app.post('/api/events/:id/orders/:orderId/send-whatsapp', ensureEventOwnership, async (req, res) => {
  try {
    const { orderId } = req.params
    const { rows } = await pool.query(
      `SELECT o.*, t.name AS tier_name
       FROM event_orders o
       JOIN event_tiers t ON t.id = o.tier_id
       WHERE o.id = $1 AND o.event_id = $2`,
      [orderId, req.event.id],
    )
    const order = rows[0]
    if (!order) return res.status(404).json({ ok: false, error: 'order_not_found' })
    if (order.status !== 'paid' || !order.attendee_id) {
      return res.status(400).json({ ok: false, error: 'order_not_paid' })
    }
    const ticketToken = await ensureTicketToken(order.id, order.ticket_token)
    const delivery = deliveryFromRequest(req, order, req.event, ticketToken)
    const whatsappAuto = await deliverTicketWhatsApp({ order, event: req.event, delivery })
    res.json({ ok: Boolean(whatsappAuto?.ok), whatsappAuto, ...delivery })
  } catch (e) {
    sendError(res, e)
  }
})

app.get('/api/stats', async (req, res) => {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined
    if (!token) return res.status(401).json({ ok: false, error: 'missing_token' })
    const payload = await verifyIdToken(token)
    const userId = String(payload.sub)
    const eventId = req.query.eventId ? String(req.query.eventId) : null

    if (eventId) {
      const owned = await pool.query('SELECT id FROM events WHERE id = $1 AND owner_id = $2', [eventId, userId])
      if (!owned.rows[0]) return res.status(403).json({ ok: false, error: 'forbidden' })
    }

    const scopeParams = eventId ? [userId, eventId] : [userId]
    const eventClause = eventId ? 'AND e.id = $2' : ''

    const { rows: events } = await pool.query(
      `SELECT id, title, date, status FROM events WHERE owner_id = $1 ORDER BY created_at DESC`,
      [userId],
    )

    const { rows: revenueRows } = await pool.query(
      `SELECT et.currency,
              SUM(et.price_cents::bigint) AS revenue_cents,
              COUNT(ea.id)::int AS ticket_count
       FROM event_attendees ea
       JOIN events e ON e.id = ea.event_id
       JOIN event_tiers et ON et.event_id = ea.event_id AND et.name = ea.label
       WHERE e.owner_id = $1 AND ea.source = 'issued' ${eventClause}
       GROUP BY et.currency`,
      scopeParams,
    )

    const { rows: salesByDate } = await pool.query(
      `SELECT DATE(ea.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') AS date,
              et.currency,
              COUNT(ea.id)::int AS count,
              SUM(et.price_cents::bigint) AS revenue_cents
       FROM event_attendees ea
       JOIN events e ON e.id = ea.event_id
       JOIN event_tiers et ON et.event_id = ea.event_id AND et.name = ea.label
       WHERE e.owner_id = $1 AND ea.source = 'issued' ${eventClause}
       GROUP BY DATE(ea.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires'), et.currency
       ORDER BY date DESC
       LIMIT 60`,
      scopeParams,
    )

    const { rows: salesByTier } = await pool.query(
      `SELECT et.id AS "tierId",
              et.name AS "tierName",
              et.currency,
              et.price_cents AS "priceCents",
              et.quantity,
              et.sold,
              COUNT(ea.id)::int AS issued_count
       FROM event_tiers et
       JOIN events e ON e.id = et.event_id
       LEFT JOIN event_attendees ea
         ON ea.event_id = et.event_id AND ea.label = et.name AND ea.source = 'issued'
       WHERE e.owner_id = $1 ${eventClause}
       GROUP BY et.id, et.name, et.currency, et.price_cents, et.quantity, et.sold
       ORDER BY issued_count DESC, et.name ASC`,
      scopeParams,
    )

    const { rows: freePassSummary } = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE gp.beneficiary_name IS NOT NULL OR gp.beneficiary_surname IS NOT NULL)::int AS assigned,
              COUNT(*) FILTER (WHERE gp.redeemed = 'true')::int AS redeemed,
              COUNT(*) FILTER (
                WHERE (gp.beneficiary_name IS NULL AND gp.beneficiary_surname IS NULL)
                  AND gp.redeemed != 'true'
              )::int AS available
       FROM guest_passes gp
       JOIN events e ON e.id = gp.event_id
       WHERE e.owner_id = $1 ${eventClause}`,
      scopeParams,
    )

    const { rows: freePassesByNote } = await pool.query(
      `SELECT COALESCE(NULLIF(TRIM(gp.note), ''), 'Sin motivo') AS note,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE gp.beneficiary_name IS NOT NULL OR gp.beneficiary_surname IS NOT NULL)::int AS assigned,
              COUNT(*) FILTER (WHERE gp.redeemed = 'true')::int AS redeemed
       FROM guest_passes gp
       JOIN events e ON e.id = gp.event_id
       WHERE e.owner_id = $1 ${eventClause}
       GROUP BY COALESCE(NULLIF(TRIM(gp.note), ''), 'Sin motivo')
       ORDER BY total DESC`,
      scopeParams,
    )

    const { rows: attendeeSummary } = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE ea.source = 'issued')::int AS issued,
              COUNT(*) FILTER (WHERE ea.source = 'free_pass')::int AS free_pass,
              COUNT(*) FILTER (WHERE ea.source = 'purchase')::int AS purchase,
              COUNT(*) FILTER (WHERE ea.verified = 'true')::int AS verified
       FROM event_attendees ea
       JOIN events e ON e.id = ea.event_id
       WHERE e.owner_id = $1 ${eventClause}`,
      scopeParams,
    )

    const { rows: onlineOrderSummary } = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE o.status = 'pending_payment')::int AS pending,
              COUNT(*) FILTER (WHERE o.status = 'paid')::int AS paid,
              COUNT(*) FILTER (WHERE o.status = 'cancelled')::int AS cancelled
       FROM event_orders o
       JOIN events e ON e.id = o.event_id
       WHERE e.owner_id = $1 ${eventClause}`,
      scopeParams,
    )

    const { rows: onlineRevenueRows } = await pool.query(
      `SELECT o.currency,
              SUM(CASE WHEN o.status = 'paid' THEN o.amount_cents::bigint ELSE 0 END) AS paid_revenue_cents,
              SUM(CASE WHEN o.status = 'pending_payment' THEN o.amount_cents::bigint ELSE 0 END) AS pending_revenue_cents,
              COUNT(*) FILTER (WHERE o.status = 'paid')::int AS paid_count,
              COUNT(*) FILTER (WHERE o.status = 'pending_payment')::int AS pending_count
       FROM event_orders o
       JOIN events e ON e.id = o.event_id
       WHERE e.owner_id = $1 ${eventClause}
       GROUP BY o.currency`,
      scopeParams,
    )

    const { rows: onlineSalesByDate } = await pool.query(
      `SELECT DATE(COALESCE(o.paid_at, o.created_at) AT TIME ZONE 'America/Argentina/Buenos_Aires') AS date,
              o.currency,
              COUNT(*) FILTER (WHERE o.status = 'paid')::int AS paid_count,
              COUNT(*) FILTER (WHERE o.status = 'pending_payment')::int AS pending_count,
              SUM(CASE WHEN o.status = 'paid' THEN o.amount_cents::bigint ELSE 0 END) AS revenue_cents
       FROM event_orders o
       JOIN events e ON e.id = o.event_id
       WHERE e.owner_id = $1 ${eventClause}
       GROUP BY DATE(COALESCE(o.paid_at, o.created_at) AT TIME ZONE 'America/Argentina/Buenos_Aires'), o.currency
       ORDER BY date DESC
       LIMIT 60`,
      scopeParams,
    )

    const { rows: onlineSalesByTier } = await pool.query(
      `SELECT t.id AS "tierId",
              t.name AS "tierName",
              t.currency,
              COUNT(*) FILTER (WHERE o.status = 'paid')::int AS paid_count,
              COUNT(*) FILTER (WHERE o.status = 'pending_payment')::int AS pending_count,
              SUM(CASE WHEN o.status = 'paid' THEN o.amount_cents::bigint ELSE 0 END) AS revenue_cents
       FROM event_orders o
       JOIN events e ON e.id = o.event_id
       JOIN event_tiers t ON t.id = o.tier_id
       WHERE e.owner_id = $1 ${eventClause}
       GROUP BY t.id, t.name, t.currency
       ORDER BY paid_count DESC, pending_count DESC, t.name ASC`,
      scopeParams,
    )

    const { rows: onlineByPayment } = await pool.query(
      `SELECT o.payment_method_type AS method,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE o.status = 'paid')::int AS paid,
              COUNT(*) FILTER (WHERE o.status = 'pending_payment')::int AS pending,
              SUM(CASE WHEN o.status = 'paid' THEN o.amount_cents::bigint ELSE 0 END) AS revenue_cents
       FROM event_orders o
       JOIN events e ON e.id = o.event_id
       WHERE e.owner_id = $1 ${eventClause}
       GROUP BY o.payment_method_type
       ORDER BY total DESC`,
      scopeParams,
    )

    const { rows: recentOnlineOrders } = await pool.query(
      `SELECT o.id,
              o.reference_code AS "referenceCode",
              o.buyer_name AS "buyerName",
              o.buyer_surname AS "buyerSurname",
              o.buyer_email AS "buyerEmail",
              o.status,
              o.amount_cents AS "amountCents",
              o.currency,
              o.payment_method_type AS "paymentMethodType",
              o.created_at AS "createdAt",
              o.paid_at AS "paidAt",
              t.name AS "tierName",
              e.title AS "eventTitle"
       FROM event_orders o
       JOIN events e ON e.id = o.event_id
       JOIN event_tiers t ON t.id = o.tier_id
       WHERE e.owner_id = $1 ${eventClause}
       ORDER BY o.created_at DESC
       LIMIT 30`,
      scopeParams,
    )

    const { rows: publishedEvents } = await pool.query(
      `SELECT COUNT(*)::int AS published,
              COUNT(*) FILTER (WHERE published = 'true')::int AS live
       FROM events WHERE owner_id = $1 ${eventId ? 'AND id = $2' : ''}`,
      eventId ? [userId, eventId] : [userId],
    )

    const fp = freePassSummary[0] || { total: 0, assigned: 0, redeemed: 0, available: 0 }
    const att = attendeeSummary[0] || { total: 0, issued: 0, free_pass: 0, purchase: 0, verified: 0 }
    const onl = onlineOrderSummary[0] || { total: 0, pending: 0, paid: 0, cancelled: 0 }

    const issuedRevenueMap = new Map(
      revenueRows.map((r) => [r.currency, Number(r.revenue_cents || 0)]),
    )
    const onlinePaidMap = new Map(
      onlineRevenueRows.map((r) => [r.currency, Number(r.paid_revenue_cents || 0)]),
    )
    const allCurrencies = new Set([...issuedRevenueMap.keys(), ...onlinePaidMap.keys()])
    const combinedRevenueByCurrency = Array.from(allCurrencies).map((currency) => ({
      currency,
      issuedRevenueCents: issuedRevenueMap.get(currency) || 0,
      onlineRevenueCents: onlinePaidMap.get(currency) || 0,
      revenueCents: (issuedRevenueMap.get(currency) || 0) + (onlinePaidMap.get(currency) || 0),
    }))

    res.json({
      ok: true,
      events,
      summary: {
        revenueByCurrency: revenueRows.map((r) => ({
          currency: r.currency,
          revenueCents: Number(r.revenue_cents || 0),
          ticketCount: Number(r.ticket_count || 0),
        })),
        combinedRevenueByCurrency,
        totalAttendees: att.total,
        issuedTickets: att.issued,
        purchaseTickets: att.purchase,
        freePassAttendees: att.free_pass,
        verifiedAttendees: att.verified,
        checkInRate: att.total > 0 ? att.verified / att.total : 0,
        freePasses: {
          total: fp.total,
          assigned: fp.assigned,
          redeemed: fp.redeemed,
          available: fp.available,
        },
        online: {
          totalOrders: onl.total,
          pendingOrders: onl.pending,
          paidOrders: onl.paid,
          cancelledOrders: onl.cancelled,
          conversionRate: onl.total > 0 ? onl.paid / onl.total : 0,
          revenueByCurrency: onlineRevenueRows.map((r) => ({
            currency: r.currency,
            revenueCents: Number(r.paid_revenue_cents || 0),
            ticketCount: Number(r.paid_count || 0),
          })),
          pendingRevenueByCurrency: onlineRevenueRows.map((r) => ({
            currency: r.currency,
            revenueCents: Number(r.pending_revenue_cents || 0),
            orderCount: Number(r.pending_count || 0),
          })),
        },
        store: {
          publishedEvents: Number(publishedEvents[0]?.live || 0),
        },
      },
      salesByDate: salesByDate.map((r) => ({
        date: r.date,
        currency: r.currency,
        count: Number(r.count || 0),
        revenueCents: Number(r.revenue_cents || 0),
      })),
      salesByTier: salesByTier.map((r) => ({
        tierId: r.tierId,
        tierName: r.tierName,
        currency: r.currency,
        priceCents: Number(r.priceCents || 0),
        quantity: Number(r.quantity || 0),
        sold: Number(r.sold || 0),
        issuedCount: Number(r.issued_count || 0),
        revenueCents: Number(r.priceCents || 0) * Number(r.issued_count || 0),
      })),
      freePassesByNote: freePassesByNote.map((r) => ({
        note: r.note,
        total: Number(r.total || 0),
        assigned: Number(r.assigned || 0),
        redeemed: Number(r.redeemed || 0),
      })),
      onlineSalesByDate: onlineSalesByDate.map((r) => ({
        date: r.date,
        currency: r.currency,
        paidCount: Number(r.paid_count || 0),
        pendingCount: Number(r.pending_count || 0),
        revenueCents: Number(r.revenue_cents || 0),
      })),
      onlineSalesByTier: onlineSalesByTier.map((r) => ({
        tierId: r.tierId,
        tierName: r.tierName,
        currency: r.currency,
        paidCount: Number(r.paid_count || 0),
        pendingCount: Number(r.pending_count || 0),
        revenueCents: Number(r.revenue_cents || 0),
      })),
      onlineByPayment: onlineByPayment.map((r) => ({
        method: r.method,
        total: Number(r.total || 0),
        paid: Number(r.paid || 0),
        pending: Number(r.pending || 0),
        revenueCents: Number(r.revenue_cents || 0),
      })),
      recentOnlineOrders: recentOnlineOrders.map((r) => ({
        ...r,
        amountCents: Number(r.amountCents || 0),
      })),
    })
  } catch (e) {
    sendError(res, e)
  }
})

export default app

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Dev API listening on http://localhost:${port}`)
  })
}

