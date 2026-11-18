import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Plus, Ticket, TrendingUp } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import '../styles/MiEvento.css'

export default function Dashboard() {
  const { user, authFetch } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return
      setLoading(true)
      setError('')
      try {
        const res = await authFetch('/api/events')
        const data = await res.json()
        if (data?.ok) {
          setEvents(data.events || [])
        } else {
          setError('No se pudieron cargar los eventos.')
        }
      } catch (err) {
        if (err?.message === 'token_expired') return
        setError('Error de red al cargar eventos.')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [user, authFetch])

  const activeCount = events.filter((e) => e.status === 'active' || e.status === 'published').length
  const draftCount = events.filter((e) => e.status === 'draft').length

  return (
    <div className="mi-evento-page">
      <div className="page-title-block">
        <div className="badge-gradient">Panel</div>
        <h1 style={{ marginTop: '0.5rem' }}>
          Hola, {user?.name?.split(' ')[0] || 'organizador'} 👋
        </h1>
        <p>Gestioná tus eventos, entradas y accesos desde un solo lugar.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card pink">
          <Calendar className="stat-icon" />
          <div className="stat-label">Total eventos</div>
          <div className="stat-value">{events.length}</div>
        </div>
        <div className="stat-card green">
          <TrendingUp className="stat-icon" />
          <div className="stat-label">Activos</div>
          <div className="stat-value">{activeCount}</div>
        </div>
        <div className="stat-card purple">
          <Ticket className="stat-icon" />
          <div className="stat-label">Borradores</div>
          <div className="stat-value">{draftCount}</div>
        </div>
        <div className="stat-card blue">
          <Plus className="stat-icon" />
          <div className="stat-label">Acción rápida</div>
          <div style={{ marginTop: '0.65rem' }}>
            <Link className="btn btn-primary btn-sm" to="/mi-evento">Crear evento</Link>
          </div>
        </div>
      </div>

      <section className="mi-evento-list-section">
        <div className="mi-evento-header" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Mis eventos</h2>
          <Link className="btn btn-primary btn-sm" to="/mi-evento">+ Nuevo evento</Link>
        </div>

        {loading && (
          <div className="empty">
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            Cargando eventos...
          </div>
        )}
        {error && <p className="empty">{error}</p>}

        {!loading && (!events || events.length === 0) ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Calendar size={24} />
            </div>
            <p>Todavía no creaste ningún evento.</p>
            <Link className="btn btn-primary mt-3" to="/mi-evento">Crear mi primer evento</Link>
          </div>
        ) : (
          !loading && (
            <ul className="event-list">
              {events.map((evt) => (
                <li key={evt.id} className="event-item card-hover">
                  <div className="event-main">
                    <h3>{evt.title}</h3>
                    <p>
                      {evt.date} · {evt.location}
                    </p>
                  </div>
                  <div className="event-meta">
                    <span className={`badge ${evt.status}`}>{evt.status}</span>
                    <span className="created">
                      {new Date(evt.createdAt).toLocaleDateString()}
                    </span>
                    <Link className="btn btn-secondary btn-sm" to={`/event/${evt.id}/edit`}>
                      Editar
                    </Link>
                    <Link className="btn btn-outline btn-sm" to={`/event/${evt.id}/attendees`}>
                      Asistentes
                    </Link>
                    <Link className="btn btn-primary btn-sm" to={`/event/${evt.id}/door`}>
                      Puerta
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </section>
    </div>
  )
}
