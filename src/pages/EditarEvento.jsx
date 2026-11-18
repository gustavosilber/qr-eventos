import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { QRCodeCanvas } from 'qrcode.react'
import VentaPublicaTab from '../components/VentaPublicaTab'
import '../styles/MiEvento.css'

export default function EditarEvento() {
  const { id } = useParams()
  const { user, authFetch } = useAuth()
  const [tab, setTab] = useState('tarifas') // 'detalles' | 'tarifas' | 'free' | 'venta'
  const [eventData, setEventData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Tarifas state
  const [tiers, setTiers] = useState([])
  const [tierName, setTierName] = useState('')
  const [tierPrice, setTierPrice] = useState('')
  const [tierCurrency, setTierCurrency] = useState('ARS')
  const [tierQuantity, setTierQuantity] = useState('0')
  const [tierPublic, setTierPublic] = useState(true)
  const [tierVisibilityStatus, setTierVisibilityStatus] = useState({})

  // Free passes
  const [passes, setPasses] = useState([])
  const [passCount, setPassCount] = useState(1)
  const [passNote, setPassNote] = useState('')
  const [assignPassId, setAssignPassId] = useState('')
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [beneficiarySurname, setBeneficiarySurname] = useState('')
  const [assignedQr, setAssignedQr] = useState('')
  const [filterNote, setFilterNote] = useState('ALL')

  const [tierMpDraft, setTierMpDraft] = useState({})
  const [tierMpStatus, setTierMpStatus] = useState({})

  const availableNotes = useMemo(() => {
    const set = new Set()
    passes.forEach((p) => {
      if (p?.note) set.add(p.note)
    })
    return Array.from(set)
  }, [passes])

  const canCreateTier = useMemo(
    () => tierName.trim().length >= 2 && Number.isFinite(Number(tierPrice)),
    [tierName, tierPrice],
  )

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      setError('')
      try {
        const [eRes, tRes, gpRes] = await Promise.all([
          authFetch(`/api/events/${id}`),
          authFetch(`/api/events/${id}/tiers`),
          authFetch(`/api/events/${id}/free-passes`),
        ])
        const eData = await eRes.json()
        const tData = await tRes.json()
        const gpData = await gpRes.json()
        if (eData?.ok) setEventData(eData.event)
        if (tData?.ok) setTiers(tData.tiers || [])
        if (gpData?.ok) setPasses(gpData.passes || [])
      } catch {
        setError('No se pudo cargar el evento.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user, authFetch])

  useEffect(() => {
    const draft = {}
    tiers.forEach((t) => {
      draft[t.id] = t.mpCheckoutUrl || ''
    })
    setTierMpDraft(draft)
  }, [tiers])

  const createTier = async (e) => {
    e.preventDefault()
    if (!user || !canCreateTier) return
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`/api/events/${id}/tiers`, {
        method: 'POST',
        body: JSON.stringify({
          name: tierName.trim(),
          price: Number(tierPrice),
          currency: tierCurrency,
          quantity: Number(tierQuantity) || 0,
          visibility: tierPublic ? 'public' : 'hidden',
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        const tRes = await authFetch(`/api/events/${id}/tiers`)
        const tData = await tRes.json()
        if (tData?.ok) setTiers(tData.tiers || [])
        setTierName('')
        setTierPrice('')
        setTierCurrency('ARS')
        setTierQuantity('0')
        setTierPublic(true)
      } else {
        setError('No se pudo crear la tarifa.')
      }
    } catch {
      setError('Error de red al crear la tarifa.')
    } finally {
      setLoading(false)
    }
  }

  const createPasses = async (e) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`/api/events/${id}/free-passes`, {
        method: 'POST',
        body: JSON.stringify({
          count: Number(passCount) || 1,
          note: passNote,
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        const gpRes = await authFetch(`/api/events/${id}/free-passes`)
        const gpData = await gpRes.json()
        if (gpData?.ok) setPasses(gpData.passes || [])
        setPassCount(1)
        setPassNote('')
      } else {
        setError('No se pudieron generar Free Passes.')
      }
    } catch {
      setError('Error de red al generar Free Passes.')
    } finally {
      setLoading(false)
    }
  }

  const saveTierMpLink = async (tierIdToSave) => {
    if (!user) return
    const url = (tierMpDraft[tierIdToSave] || '').trim()
    setTierMpStatus((s) => ({ ...s, [tierIdToSave]: 'saving' }))
    setError('')
    try {
      const res = await authFetch(`/api/events/${id}/tiers/${tierIdToSave}`, {
        method: 'PATCH',
        body: JSON.stringify({ mpCheckoutUrl: url }),
      })
      let data = {}
      try {
        data = await res.json()
      } catch {
        /* non-json response */
      }
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `http_${res.status}`)
      }
      const tRes = await authFetch(`/api/events/${id}/tiers`)
      const tData = await tRes.json()
      if (tData?.ok) setTiers(tData.tiers || [])
      setTierMpStatus((s) => ({ ...s, [tierIdToSave]: 'saved' }))
      setTimeout(() => {
        setTierMpStatus((s) => ({ ...s, [tierIdToSave]: null }))
      }, 2500)
    } catch (err) {
      setTierMpStatus((s) => ({ ...s, [tierIdToSave]: 'error' }))
      const msg = String(err?.message || '')
      if (msg.includes('http_404') || msg.includes('Failed to fetch')) {
        setError('No se pudo guardar: el servidor API no está actualizado o no está corriendo. Ejecutá: node dev-api/server.js')
      } else {
        setError('No se pudo guardar el link de Mercado Pago.')
      }
    }
  }

  const toggleTierVisibility = async (tier) => {
    if (!user) return
    const next = tier.visibility === 'public' ? 'hidden' : 'public'
    setTierVisibilityStatus((s) => ({ ...s, [tier.id]: 'saving' }))
    setError('')
    try {
      const res = await authFetch(`/api/events/${id}/tiers/${tier.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ visibility: next }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || `http_${res.status}`)
      setTiers((list) =>
        list.map((t) => (t.id === tier.id ? { ...t, visibility: next } : t)),
      )
      setTierVisibilityStatus((s) => ({ ...s, [tier.id]: 'saved' }))
      setTimeout(() => {
        setTierVisibilityStatus((s) => ({ ...s, [tier.id]: null }))
      }, 2000)
    } catch {
      setTierVisibilityStatus((s) => ({ ...s, [tier.id]: 'error' }))
      setError('No se pudo actualizar la visibilidad de la tarifa.')
    }
  }

  const assignPass = async (e) => {
    e.preventDefault()
    if (!user || !assignPassId || !beneficiaryName || !beneficiarySurname) return
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`/api/free-passes/${assignPassId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ beneficiaryName, beneficiarySurname }),
      })
      const data = await res.json()
      if (data?.ok) {
        setAssignedQr(data.qrData)
        const gpRes = await authFetch(`/api/events/${id}/free-passes`)
        const gpData = await gpRes.json()
        if (gpData?.ok) setPasses(gpData.passes || [])
      } else {
        setError('No se pudo asignar el Free Pass.')
      }
    } catch {
      setError('Error de red al asignar Free Pass.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mi-evento-page">
      <div className="page-title-block">
        <div className="badge-gradient">Evento</div>
        <h1 style={{ marginTop: '0.5rem' }}>Editar evento</h1>
        {eventData && (
          <p>{eventData.title} · {eventData.date} · {eventData.location}</p>
        )}
      </div>

      <div className="tabs">
        <button type="button" className={`tab${tab === 'detalles' ? ' active' : ''}`} onClick={() => setTab('detalles')}>
          Detalles
        </button>
        <button type="button" className={`tab${tab === 'tarifas' ? ' active' : ''}`} onClick={() => setTab('tarifas')}>
          Tarifas
        </button>
        <button type="button" className={`tab${tab === 'free' ? ' active' : ''}`} onClick={() => setTab('free')}>
          Free Pass
        </button>
        <button type="button" className={`tab${tab === 'venta' ? ' active' : ''}`} onClick={() => setTab('venta')}>
          Venta pública
        </button>
        <Link className="btn btn-primary btn-sm" to={`/event/${id}/issue`} style={{ marginLeft: 'auto' }}>Emitir entrada</Link>
        <Link className="btn btn-secondary btn-sm" to={`/event/${id}/door`}>Control puerta</Link>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="empty">{error}</p>}

      {tab === 'detalles' && (
        <section className="mi-evento-form-section">
          <p>Próximamente: edición de título, fecha, ubicación y descripción.</p>
        </section>
      )}

      {tab === 'tarifas' && (
        <>
          <section className="mi-evento-form-section">
            <h2>Agregar tarifa</h2>
            <form className="mi-evento-form" onSubmit={createTier}>
              <label>
                Nombre
                <input value={tierName} onChange={(e) => setTierName(e.target.value)} placeholder="Social + 1 Taller" />
              </label>
              <label>
                Precio
                <input value={tierPrice} onChange={(e) => setTierPrice(e.target.value)} placeholder="10000" />
              </label>
              <label>
                Moneda
                <input value={tierCurrency} onChange={(e) => setTierCurrency(e.target.value)} placeholder="ARS" />
              </label>
              <label>
                Cupo
                <input value={tierQuantity} onChange={(e) => setTierQuantity(e.target.value)} placeholder="0" />
              </label>
              <label className="tier-public-check">
                <input
                  type="checkbox"
                  checked={tierPublic}
                  onChange={(e) => setTierPublic(e.target.checked)}
                />
                Publicar en la tienda online
              </label>
              <button className="btn btn-primary" type="submit" disabled={!canCreateTier}>
                Crear tarifa
              </button>
            </form>
          </section>

          <section className="mi-evento-list-section">
            <h2>Tarifas</h2>
            <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
              Activá cuáles se muestran en la venta pública y pegá el link de Mercado Pago por tarifa.
            </p>
            {(!tiers || tiers.length === 0) ? (
              <p className="empty">Todavía no agregaste tarifas.</p>
            ) : (
              <ul className="event-list">
                {tiers.map((t) => {
                  const isPublic = t.visibility !== 'hidden'
                  return (
                  <li key={t.id} className="event-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div className="tier-row-header">
                      <div className="event-main">
                        <h3>{t.name}</h3>
                        <p>
                          {t.currency} {Number(t.priceCents) / 100} · Cupo {t.quantity} · Vendidas {t.sold}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`tier-visibility-toggle${isPublic ? ' is-public' : ''}`}
                        disabled={tierVisibilityStatus[t.id] === 'saving'}
                        onClick={() => toggleTierVisibility(t)}
                        title={isPublic ? 'Ocultar de la tienda pública' : 'Mostrar en la tienda pública'}
                      >
                        {tierVisibilityStatus[t.id] === 'saving'
                          ? 'Guardando...'
                          : isPublic
                            ? 'En venta pública'
                            : 'Oculta'}
                      </button>
                    </div>
                    <div className="tier-mp-row">
                      <label style={{ flex: 1, fontSize: '0.82rem' }}>
                        Link Mercado Pago
                        <input
                          value={tierMpDraft[t.id] ?? ''}
                          onChange={(e) =>
                            setTierMpDraft((d) => ({ ...d, [t.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              saveTierMpLink(t.id)
                            }
                          }}
                          placeholder="https://mpago.la/..."
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ alignSelf: 'flex-end', marginBottom: 2 }}
                        disabled={tierMpStatus[t.id] === 'saving'}
                        onClick={() => saveTierMpLink(t.id)}
                      >
                        {tierMpStatus[t.id] === 'saving' ? 'Guardando...' : 'Guardar link'}
                      </button>
                    </div>
                    {tierMpStatus[t.id] === 'saved' && (
                      <span className="tier-mp-saved">✓ Link guardado</span>
                    )}
                    {tierMpStatus[t.id] === 'error' && (
                      <span className="tier-mp-error">Error al guardar — reintentá</span>
                    )}
                    {tierVisibilityStatus[t.id] === 'saved' && (
                      <span className="tier-mp-saved">
                        {isPublic ? '✓ Visible en la tienda' : '✓ Oculta de la tienda'}
                      </span>
                    )}
                    {t.mpCheckoutUrl && tierMpStatus[t.id] !== 'saved' && isPublic && (
                      <span className="muted" style={{ fontSize: '0.78rem' }}>
                        Link activo en la tienda pública
                      </span>
                    )}
                  </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}

      {tab === 'free' && (
        <>
          <section className="mi-evento-form-section">
            <h2>Generar Free Pass</h2>
            <form className="mi-evento-form" onSubmit={createPasses}>
              <label>
                Cantidad
                <input type="number" min="1" max="100" value={passCount} onChange={(e) => setPassCount(e.target.value)} />
              </label>
              <label>
                Nota (opcional)
                <input value={passNote} onChange={(e) => setPassNote(e.target.value)} placeholder="Invitado especial" />
              </label>
              <button className="btn btn-primary" type="submit">
                Generar
              </button>
            </form>
          </section>

          <section className="mi-evento-form-section">
            <h2>Asignar Free Pass</h2>
            <form className="mi-evento-form" onSubmit={assignPass}>
              <label>
                Tipo de Free Pass (motivo)
                <select value={filterNote} onChange={(e) => setFilterNote(e.target.value)}>
                  <option value="ALL">Todos</option>
                  {availableNotes.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Seleccionar Free Pass
                <select value={assignPassId} onChange={(e) => setAssignPassId(e.target.value)}>
                  <option value="">Elegir...</option>
                  {passes
                    .filter((p) => !p.beneficiaryName && !p.beneficiarySurname)
                    .filter((p) => filterNote === 'ALL' || (p.note || '') === filterNote)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} · {p.note || 'Sin motivo'} · {new Date(p.createdAt).toLocaleString()}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Nombre
                <input value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} placeholder="Gustavo" />
              </label>
              <label>
                Apellido
                <input value={beneficiarySurname} onChange={(e) => setBeneficiarySurname(e.target.value)} placeholder="Silber" />
              </label>
              <button className="btn btn-primary" type="submit">
                Generar QR
              </button>
            </form>
            {assignedQr && (
              <div className="qr-display">
                <QRCodeCanvas value={assignedQr} size={180} />
                <div style={{ textAlign: 'center' }}>
                  <strong>{beneficiaryName} {beneficiarySurname}</strong>
                  <div className="badge-gradient" style={{ marginTop: 8 }}>Free Pass</div>
                  {eventData?.title && <p className="muted mt-2">{eventData.title}</p>}
                  {eventData?.date && <p className="muted">{eventData.date}</p>}
                </div>
              </div>
            )}
          </section>

          <section className="mi-evento-list-section">
            <h2>Últimos Free Pass</h2>
            {(!passes || passes.length === 0) ? (
              <p className="empty">Aún no generaste Free Passes.</p>
            ) : (
              <ul className="event-list compact">
                {passes.map((p) => (
                  <li key={p.id} className="event-item compact">
                    <div className="event-main">
                      <h3 style={{ marginBottom: 2 }}>{p.code}</h3>
                      <p>
                        Emitido: {new Date(p.createdAt).toLocaleString()} {p.note ? `· ${p.note}` : ''}
                        {(p.beneficiaryName || p.beneficiarySurname) ? (
                          <>
                            {' '}
                            · Titular: {p.beneficiaryName} {p.beneficiarySurname}
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div className="event-meta">
                      <span className={`badge ${p.redeemed ? 'redeemed' : (p.beneficiaryName || p.beneficiarySurname) ? 'assigned' : 'available'}`}>
                        {p.redeemed ? 'Canjeado' : (p.beneficiaryName || p.beneficiarySurname) ? 'ASIGNADO' : 'Disponible'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {tab === 'venta' && (
        <VentaPublicaTab eventId={id} authFetch={authFetch} eventTitle={eventData?.title || 'Evento'} />
      )}
    </div>
  )
}

