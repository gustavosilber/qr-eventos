import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScanLine } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import '../styles/MiEvento.css'
import '../styles/ControlPuerta.css'

export default function EscanearEntrada() {
  const { user, authFetch } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      setError('')
      try {
        const res = await authFetch('/api/events')
        const data = await res.json()
        if (data?.ok) setEvents(data.events || [])
        else setError('No se pudieron cargar los eventos.')
      } catch (err) {
        if (err?.message !== 'token_expired') setError('Error de red.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authFetch])

  return (
    <div className="mi-evento-page door-page">
      <div className="page-title-block">
        <div className="badge-gradient">Puerta</div>
        <h1 style={{ marginTop: '0.5rem' }}>Control de puerta</h1>
        <p>Elegí el evento para validar ingresos con QR.</p>
      </div>

      {loading && <p className="empty">Cargando eventos...</p>}
      {error && <p className="empty">{error}</p>}

      {!loading && events.length === 0 && !error && (
        <div className="empty">
          <p>No tenés eventos todavía.</p>
          <Link className="btn btn-primary mt-3" to="/mi-evento">Crear evento</Link>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="event-picker-list">
          {events.map((ev) => (
            <Link key={ev.id} className="event-picker-item" to={`/event/${ev.id}/door`}>
              <div>
                <h3>{ev.title}</h3>
                <p>{ev.date} · {ev.location}</p>
              </div>
              <span className="btn btn-primary btn-sm">
                <ScanLine size={14} /> Abrir puerta
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
