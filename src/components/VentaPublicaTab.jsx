import React, { useEffect, useState } from 'react'
import { Copy, Check, ExternalLink, Plus, Trash2, QrCode, X, MessageCircle, Mail, ImagePlus } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'

async function fileToCoverDataUrl(file) {
  if (!file || !file.type?.startsWith('image/')) {
    throw new Error('invalid_image')
  }
  if (file.size > 6 * 1024 * 1024) {
    throw new Error('image_too_large')
  }
  const bitmap = await createImageBitmap(file)
  const maxW = 1600
  const scale = Math.min(1, maxW / bitmap.width)
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  return canvas.toDataURL('image/jpeg', 0.82)
}

const PAYMENT_TYPES = [
  { value: 'transfer', label: 'Transferencia bancaria' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'cash', label: 'Efectivo / boletería' },
]

function formatMoney(cents, currency = 'ARS') {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(cents) / 100)
  } catch {
    return `${currency} ${(Number(cents) / 100).toFixed(0)}`
  }
}

export default function VentaPublicaTab({ eventId, authFetch, eventTitle }) {
  const [store, setStore] = useState(null)
  const [methods, setMethods] = useState([])
  const [orders, setOrders] = useState([])
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [ticketModal, setTicketModal] = useState(null)

  const [pmType, setPmType] = useState('transfer')
  const [pmLabel, setPmLabel] = useState('')
  const [pmConfig, setPmConfig] = useState({})
  const [coverDraft, setCoverDraft] = useState('')
  const [coverStatus, setCoverStatus] = useState(null)

  const load = async () => {
    if (!authFetch) return
    setLoading(true)
    setError('')
    try {
      const [storeRes, ordersRes, tiersRes] = await Promise.all([
        authFetch(`/api/events/${eventId}/store`),
        authFetch(`/api/events/${eventId}/orders`),
        authFetch(`/api/events/${eventId}/tiers`),
      ])
      const storeData = await storeRes.json()
      const ordersData = await ordersRes.json()
      const tiersData = await tiersRes.json()
      if (storeData?.ok) {
        setStore(storeData.store)
        setMethods(storeData.paymentMethods || [])
        setCoverDraft(storeData.store?.coverImage || '')
      }
      if (ordersData?.ok) setOrders(ordersData.orders || [])
      if (tiersData?.ok) setTiers(tiersData.tiers || [])
    } catch (err) {
      if (err?.message !== 'token_expired') setError('No se pudo cargar la tienda.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, authFetch])

  const publicUrl = store?.publicSlug
    ? `${window.location.origin}/e/${store.publicSlug}`
    : null

  const openTicketFromResponse = (data, orderHint) => {
    if (!data?.qrData) return
    setTicketModal({
      qrData: data.qrData,
      ticket: data.ticket || null,
      order: orderHint || null,
      ticketUrl: data.ticketUrl || null,
      whatsappUrl: data.whatsappUrl || null,
      emailUrl: data.emailUrl || null,
      buyerWhatsapp: data.buyerWhatsapp || orderHint?.buyerWhatsapp || null,
      buyerEmail: data.buyerEmail || orderHint?.buyerEmail || null,
      whatsappAuto: data.whatsappAuto || null,
    })
  }

  const resendWhatsapp = async (order) => {
    try {
      setLoading(true)
      setError('')
      const res = await authFetch(`/api/events/${eventId}/orders/${order.id}/send-whatsapp`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data?.whatsappAuto) {
        setTicketModal((prev) =>
          prev
            ? { ...prev, whatsappAuto: data.whatsappAuto, ticketUrl: data.ticketUrl || prev.ticketUrl }
            : prev,
        )
        if (!data.ok) setError(data.whatsappAuto?.error || 'No se pudo enviar por WhatsApp.')
      } else {
        setError('No se pudo enviar por WhatsApp.')
      }
    } catch {
      setError('Error al reenviar WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  const togglePublish = async () => {
    try {
      setLoading(true)
      const res = await authFetch(`/api/events/${eventId}/store`, {
        method: 'PUT',
        body: JSON.stringify({ published: !store?.published }),
      })
      const data = await res.json()
      if (data?.ok) await load()
      else setError('No se pudo actualizar la publicación.')
    } catch {
      setError('Error al publicar.')
    } finally {
      setLoading(false)
    }
  }

  const saveCoverImage = async (nextCover) => {
    try {
      setCoverStatus('saving')
      setError('')
      const res = await authFetch(`/api/events/${eventId}/store`, {
        method: 'PUT',
        body: JSON.stringify({
          published: store?.published,
          coverImage: nextCover || null,
        }),
      })
      const data = await res.json()
      if (!data?.ok) throw new Error('save_failed')
      setStore((s) => (s ? { ...s, coverImage: nextCover || null } : s))
      setCoverDraft(nextCover || '')
      setCoverStatus('saved')
      setTimeout(() => setCoverStatus(null), 2500)
    } catch {
      setCoverStatus('error')
      setError('No se pudo guardar la imagen del hero.')
    }
  }

  const onCoverFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setCoverStatus('saving')
      const dataUrl = await fileToCoverDataUrl(file)
      await saveCoverImage(dataUrl)
    } catch (err) {
      setCoverStatus('error')
      if (err?.message === 'image_too_large') {
        setError('La imagen es muy pesada (máx. 6 MB).')
      } else {
        setError('No se pudo procesar la imagen.')
      }
    }
  }

  const copyUrl = async () => {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const addPaymentMethod = async (e) => {
    e.preventDefault()
    const defaultLabels = {
      transfer: 'Transferencia bancaria',
      mercadopago: 'Mercado Pago',
      cash: 'Efectivo en boletería',
    }
    try {
      setLoading(true)
      const res = await authFetch(`/api/events/${eventId}/payment-methods`, {
        method: 'POST',
        body: JSON.stringify({
          type: pmType,
          label: pmLabel.trim() || defaultLabels[pmType],
          config: pmConfig,
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        setPmLabel('')
        setPmConfig({})
        await load()
      } else setError('No se pudo agregar el método.')
    } catch {
      setError('Error al agregar método.')
    } finally {
      setLoading(false)
    }
  }

  const removeMethod = async (pmId) => {
    if (!window.confirm('¿Eliminar este método de pago?')) return
    try {
      await authFetch(`/api/events/${eventId}/payment-methods/${pmId}`, { method: 'DELETE' })
      await load()
    } catch {
      /* no-op */
    }
  }

  const confirmOrder = async (order) => {
    try {
      setLoading(true)
      setError('')
      const res = await authFetch(`/api/events/${eventId}/orders/${order.id}/confirm`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data?.ok) {
        await load()
        openTicketFromResponse(data, order)
      } else setError('No se pudo confirmar el pago.')
    } catch {
      setError('Error al confirmar.')
    } finally {
      setLoading(false)
    }
  }

  const openOrderTicket = async (order) => {
    try {
      setLoading(true)
      setError('')
      const res = await authFetch(`/api/events/${eventId}/orders/${order.id}/ticket`)
      const data = await res.json()
      if (data?.ok) openTicketFromResponse(data, order)
      else setError('No se pudo abrir el QR de esta entrada.')
    } catch {
      setError('Error al cargar el QR.')
    } finally {
      setLoading(false)
    }
  }

  const ticket = ticketModal?.ticket
  const order = ticketModal?.order

  const renderConfigFields = () => {
    if (pmType === 'transfer') {
      return (
        <>
          <label>Banco<input value={pmConfig.bankName || ''} onChange={(e) => setPmConfig({ ...pmConfig, bankName: e.target.value })} placeholder="Galicia" /></label>
          <label>CBU<input value={pmConfig.cbu || ''} onChange={(e) => setPmConfig({ ...pmConfig, cbu: e.target.value })} /></label>
          <label>Alias<input value={pmConfig.alias || ''} onChange={(e) => setPmConfig({ ...pmConfig, alias: e.target.value })} /></label>
          <label>Titular<input value={pmConfig.holderName || ''} onChange={(e) => setPmConfig({ ...pmConfig, holderName: e.target.value })} /></label>
          <label>Instrucciones<textarea value={pmConfig.instructions || ''} onChange={(e) => setPmConfig({ ...pmConfig, instructions: e.target.value })} rows={2} /></label>
        </>
      )
    }
    if (pmType === 'mercadopago') {
      return (
        <p className="muted" style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
          Activá Mercado Pago aquí. El link de pago (<code>mpago.la/...</code>) se configura{' '}
          <strong>por cada tarifa</strong> en la pestaña <strong>Tarifas</strong> — uno por tipo de entrada y monto.
        </p>
      )
    }
    return (
      <label>
        Instrucciones
        <textarea value={pmConfig.instructions || ''} onChange={(e) => setPmConfig({ ...pmConfig, instructions: e.target.value })} rows={2} placeholder="Dónde y cuándo pagar en efectivo" />
      </label>
    )
  }

  return (
    <div>
      {loading && <p className="muted">Cargando...</p>}
      {error && <p className="empty">{error}</p>}

      <section className="mi-evento-form-section">
        <h2>Página pública de venta</h2>
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Publicá una URL para que los asistentes compren entradas online.
        </p>

        <div className="store-publish-row">
          <div>
            <strong>{store?.published ? 'Publicada' : 'Borrador'}</strong>
            <p className="muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {store?.published
                ? 'La página es visible para cualquier persona con el link.'
                : 'Activá la publicación para generar el link.'}
            </p>
          </div>
          <button type="button" className={`btn ${store?.published ? 'btn-secondary' : 'btn-primary'}`} onClick={togglePublish}>
            {store?.published ? 'Despublicar' : 'Publicar evento'}
          </button>
        </div>

        {publicUrl && (
          <div className="store-url-box">
            <input readOnly value={publicUrl} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={copyUrl} title="Copiar">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
              <ExternalLink size={16} /> Ver
            </a>
          </div>
        )}

        {!store?.published && store?.publicSlug && (
          <p className="muted mt-2" style={{ fontSize: '0.85rem' }}>
            Slug: <code>{store.publicSlug}</code>
          </p>
        )}
      </section>

      <section className="mi-evento-form-section">
        <h2>Imagen del hero</h2>
        <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
          Esta imagen se muestra a todo el ancho en la página pública de venta.
        </p>
        <div className="cover-editor">
          <div
            className={`cover-preview${coverDraft ? '' : ' empty'}`}
            style={coverDraft ? { backgroundImage: `url(${coverDraft})` } : undefined}
          >
            {!coverDraft && 'Sin imagen todavía'}
          </div>
          <label>
            URL de la imagen
            <input
              value={coverDraft.startsWith('data:') ? '' : coverDraft}
              onChange={(e) => setCoverDraft(e.target.value)}
              placeholder="https://... o subí un archivo"
            />
          </label>
          {coverDraft.startsWith('data:') && (
            <p className="muted" style={{ fontSize: '0.8rem' }}>
              Imagen cargada desde archivo (guardada en el evento).
            </p>
          )}
          <div className="cover-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={coverStatus === 'saving'}
              onClick={() => saveCoverImage(coverDraft.trim())}
            >
              {coverStatus === 'saving' ? 'Guardando...' : 'Guardar imagen'}
            </button>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
              <ImagePlus size={14} /> Subir archivo
              <input type="file" accept="image/*" hidden onChange={onCoverFile} />
            </label>
            {coverDraft && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={coverStatus === 'saving'}
                onClick={() => saveCoverImage('')}
              >
                Quitar imagen
              </button>
            )}
          </div>
          {coverStatus === 'saved' && <span className="tier-mp-saved">✓ Imagen guardada</span>}
          {coverStatus === 'error' && <span className="tier-mp-error">Error al guardar</span>}
        </div>
      </section>

      <section className="mi-evento-form-section">
        <h2>Tarifas en la tienda</h2>
        <p className="muted" style={{ marginBottom: '0.75rem', fontSize: '0.88rem' }}>
          Solo las marcadas como públicas aparecen en la página de venta. Las configurás en la pestaña{' '}
          <strong>Tarifas</strong>.
        </p>
        {tiers.length === 0 ? (
          <p className="empty">Todavía no hay tarifas.</p>
        ) : (
          <ul className="event-list compact">
            {tiers.map((t) => {
              const isPublic = t.visibility !== 'hidden'
              return (
                <li key={t.id} className="event-item compact">
                  <div className="event-main">
                    <h3>{t.name}</h3>
                    <p>
                      {formatMoney(t.priceCents, t.currency)}
                      {' · '}
                      {isPublic ? 'Visible en venta pública' : 'Oculta'}
                    </p>
                  </div>
                  <span className={`badge ${isPublic ? 'assigned' : 'available'}`}>
                    {isPublic ? 'Pública' : 'Oculta'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="mi-evento-form-section">
        <h2>Métodos de pago</h2>
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Configurá cómo pueden pagar los compradores de <strong>{eventTitle}</strong>.
        </p>

        {methods.length === 0 ? (
          <p className="empty">Todavía no agregaste métodos de pago.</p>
        ) : (
          <ul className="event-list compact">
            {methods.map((m) => (
              <li key={m.id} className="event-item compact">
                <div className="event-main">
                  <h3>{m.label}</h3>
                  <p>{PAYMENT_TYPES.find((t) => t.value === m.type)?.label || m.type}</p>
                </div>
                <button type="button" className="icon-btn danger" onClick={() => removeMethod(m.id)} title="Eliminar">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form className="mi-evento-form mt-3" onSubmit={addPaymentMethod}>
          <label>
            Tipo
            <select value={pmType} onChange={(e) => { setPmType(e.target.value); setPmConfig({}) }}>
              {PAYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label>
            Nombre visible (opcional)
            <input value={pmLabel} onChange={(e) => setPmLabel(e.target.value)} placeholder="Ej: Transferencia" />
          </label>
          {renderConfigFields()}
          <button type="submit" className="btn btn-primary btn-sm">
            <Plus size={16} /> Agregar método
          </button>
        </form>
      </section>

      <section className="mi-evento-list-section">
        <h2>Órdenes de compra</h2>
        {orders.length === 0 ? (
          <p className="empty">Sin compras registradas aún.</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Comprador</th>
                  <th>Entrada</th>
                  <th>Monto</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><code>{o.referenceCode}</code></td>
                    <td>
                      {o.buyerName} {o.buyerSurname}
                      <br /><small className="muted">{o.buyerEmail}</small>
                      {o.buyerWhatsapp && (
                        <>
                          <br /><small className="muted">WA: {o.buyerWhatsapp}</small>
                        </>
                      )}
                    </td>
                    <td>{o.tierName}</td>
                    <td>{formatMoney(o.amountCents, o.currency)}</td>
                    <td>{o.paymentMethodType}</td>
                    <td>
                      <span className={`badge ${o.status === 'paid' ? 'assigned' : 'available'}`}>
                        {o.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {o.status !== 'paid' ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => confirmOrder(o)}>
                          Confirmar pago
                        </button>
                      ) : (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openOrderTicket(o)}>
                          <QrCode size={14} /> Ver QR
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {ticketModal && (
        <div className="ticket-modal-overlay" onClick={() => setTicketModal(null)} role="presentation">
          <div
            className="ticket-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Entrada QR"
          >
            <button type="button" className="ticket-modal-close" onClick={() => setTicketModal(null)} aria-label="Cerrar">
              <X size={20} />
            </button>
            <h3>Entrada generada</h3>
            <div className="ticket-qr-wrap">
              <QRCodeCanvas value={ticketModal.qrData} size={220} includeMargin />
            </div>
            <div className="ticket-details">
              <strong>
                {(ticket?.nombre || order?.buyerName || '')}{' '}
                {(ticket?.apellido || order?.buyerSurname || '')}
              </strong>
              <span>{ticket?.tier || order?.tierName}</span>
              {(ticket?.monto || order?.amountCents) && (
                <span>
                  {ticket?.monto
                    ? formatMoney(Number(ticket.monto) * 100, ticket.currency || order?.currency)
                    : formatMoney(order.amountCents, order.currency)}
                </span>
              )}
              {(ticket?.referencia || order?.referenceCode) && (
                <span className="muted">Ref. {ticket?.referencia || order?.referenceCode}</span>
              )}
              {(ticket?.evento || eventTitle) && (
                <span className="muted">{ticket?.evento || eventTitle}</span>
              )}
            </div>

            {ticketModal.whatsappAuto?.ok && ticketModal.whatsappAuto.ticketIncluded !== false && (
              <p className="ticket-wa-ok">✓ WhatsApp enviado automáticamente al comprador</p>
            )}
            {ticketModal.whatsappAuto?.ok && ticketModal.whatsappAuto.ticketIncluded === false && (
              <p className="ticket-wa-ok" style={{ background: 'rgba(217,119,6,0.1)', color: '#b45309' }}>
                {ticketModal.whatsappAuto.warning ||
                  'WhatsApp de prueba enviado (hello_world). No incluye el link del QR todavía.'}
              </p>
            )}
            {ticketModal.whatsappAuto && !ticketModal.whatsappAuto.ok && !ticketModal.whatsappAuto.skipped && (
              <p className="ticket-wa-err">
                No se pudo enviar automático: {ticketModal.whatsappAuto.error}
                {ticketModal.whatsappAuto.code === 131047
                  ? ' — Pasaron más de 24h sin que el comprador escriba. Hay que usar una plantilla (ya configuramos hello_world).'
                  : ''}
                {ticketModal.whatsappAuto.code === 131030
                  ? ' — Meta no reconoce el formato del número.'
                  : ''}
                {ticketModal.whatsappAuto.tried?.length
                  ? ` Probamos: ${ticketModal.whatsappAuto.tried.join(', ')}`
                  : ''}
              </p>
            )}

            <div className="ticket-send-actions">
              {order && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => resendWhatsapp(order)}
                  disabled={loading}
                >
                  <MessageCircle size={16} />{' '}
                  {ticketModal.whatsappAuto?.ok ? 'Reenviar WhatsApp' : 'Enviar WhatsApp ahora'}
                </button>
              )}
              {ticketModal.whatsappUrl && (
                <a
                  className="btn btn-secondary"
                  href={ticketModal.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={16} /> Abrir chat manual
                </a>
              )}
              {ticketModal.emailUrl && (
                <a className="btn btn-secondary" href={ticketModal.emailUrl}>
                  <Mail size={16} /> Enviar por email
                </a>
              )}
              {ticketModal.ticketUrl && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(ticketModal.ticketUrl)
                  }}
                >
                  <Copy size={14} /> Copiar link de entrada
                </button>
              )}
            </div>

            <p className="muted" style={{ fontSize: '0.82rem', textAlign: 'center', marginTop: '0.75rem' }}>
              Con el número de prueba de Meta, el WhatsApp del comprador tiene que estar en la lista de destinatarios.
            </p>
            <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => setTicketModal(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
