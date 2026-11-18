import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { QRCodeCanvas } from 'qrcode.react'
import '../styles/MiEvento.css'

export default function EmitirEntrada() {
  const { id } = useParams()
  const { user, authFetch } = useAuth()
  const [eventData, setEventData] = useState(null)
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [tierId, setTierId] = useState('')
  const [qrData, setQrData] = useState('')

  const canSubmit = useMemo(() => name.trim().length >= 2 && tierId, [name, tierId])

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      setError('')
      try {
        const [eRes, tRes] = await Promise.all([
          authFetch(`/api/events/${id}`),
          authFetch(`/api/events/${id}/tiers`),
        ])
        const eData = await eRes.json()
        const tData = await tRes.json()
        if (eData?.ok) setEventData(eData.event)
        if (tData?.ok) setTiers(tData.tiers || [])
      } catch {
        setError('No se pudieron cargar datos del evento.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user, authFetch])

  const submit = async (e) => {
    e.preventDefault()
    if (!user || !canSubmit) return
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`/api/events/${id}/issue`, {
        method: 'POST',
        body: JSON.stringify({ beneficiaryName: name.trim(), beneficiarySurname: surname.trim(), tierId }),
      })
      const data = await res.json()
      if (data?.ok) {
        setQrData(data.qrData)
      } else {
        setError('No se pudo emitir la entrada.')
      }
    } catch {
      setError('Error de red al emitir la entrada.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mi-evento-page">
      <header className="mi-evento-header">
        <div>
          <h1>Emitir Entrada</h1>
          {eventData && (
            <p>
              {eventData.title} · {eventData.date} · {eventData.location}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn btn-secondary" to={`/event/${id}/attendees`}>Ver asistentes</Link>
          <Link className="btn btn-secondary" to={`/event/${id}/edit`}>Volver a editar</Link>
        </div>
      </header>

      <section className="mi-evento-form-section">
        <h2>Datos del asistente</h2>
        <form className="mi-evento-form" onSubmit={submit}>
          <label>
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Gustavo" required />
          </label>
          <label>
            Apellido
            <input value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="Silber" />
          </label>
          <label>
            Tipo de entrada (tarifa)
            <select value={tierId} onChange={(e) => setTierId(e.target.value)} required>
              <option value="">Elegir...</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-primary" type="submit" disabled={!canSubmit || loading}>
            Emitir
          </button>
        </form>
      </section>

      {qrData && (
        <section className="mi-evento-list-section" style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
          <QRCodeCanvas value={qrData} size={200} />
          <div style={{ textAlign: 'center' }}>
            <strong>{name} {surname}</strong>
            <div>Entrada emitida</div>
          </div>
        </section>
      )}
    </div>
  )
}

