import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import '../styles/MiEvento.css'

function loadEvents(userId) {
  try {
    const raw = localStorage.getItem(`qr-eventos:events:${userId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveEvents(userId, events) {
  localStorage.setItem(`qr-eventos:events:${userId}`, JSON.stringify(events))
}

export default function MiEvento() {
  const { user, authFetch } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  const [events, setEvents] = useState(() => (user ? loadEvents(user.id) : []))
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
      } catch {
        setError('Error de red al cargar eventos.')
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authFetch])

  const canSubmit = useMemo(() => title.trim().length >= 3 && date && location.trim().length >= 3, [title, date, location])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!user) return
    try {
      setLoading(true)
      const res = await authFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          date,
          location: location.trim(),
          description: description.trim(),
        }),
      })
      const data = await res.json()
      if (data?.ok) {
        navigate('/dashboard', { replace: true })
      } else {
        setError('No se pudo crear el evento.')
      }
    } catch (err) {
      if (err?.message === 'token_expired') return
      setError('Error de red al crear el evento.')
    } finally {
      setLoading(false)
    }
    setTitle('')
    setDate('')
    setLocation('')
    setDescription('')
  }

  return (
    <div className="mi-evento-page">
      <div className="page-title-block">
        <div className="badge-gradient">Nuevo evento</div>
        <h1 style={{ marginTop: '0.5rem' }}>Crear evento</h1>
        <p>Completá los datos básicos para publicar tu evento.</p>
      </div>

      <section className="mi-evento-form-section card">
        <h2>Crear nuevo evento</h2>
        <form className="mi-evento-form" onSubmit={handleCreate}>
          <label>
            Nombre del evento
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Merlo Baila" required />
          </label>

          <label>
            Fecha
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>

          <label>
            Ubicación
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Club Social Merlo" required />
          </label>

          <label>
            Descripción
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles del evento (opcional)" />
          </label>

          <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
            Crear evento
          </button>
        </form>
      </section>

      {error && (
        <section className="mi-evento-list-section">
          <p className="empty">{error}</p>
        </section>
      )}
    </div>
  )
}

