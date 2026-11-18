import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, Pencil, Trash2, Save, X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import '../styles/MiEvento.css'

export default function AsistentesEvento() {
  const { id } = useParams()
  const { user, authFetch } = useAuth()
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editFullName, setEditFullName] = useState('')
  const [editLabel, setEditLabel] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`/api/events/${id}/attendees`)
      const data = await res.json()
      if (data?.ok) {
        setAttendees(data.attendees || [])
      } else {
        setError('No se pudieron cargar los asistentes.')
      }
    } catch (err) {
      if (err?.message === 'token_expired') return
      setError('Error de red al cargar asistentes.')
    } finally {
      setLoading(false)
    }
  }, [user, authFetch, id])

  useEffect(() => {
    load()
  }, [load])

  const verify = async (attendeeId) => {
    if (!user) return
    try {
      await authFetch(`/api/events/${id}/attendees/verify`, {
        method: 'POST',
        body: JSON.stringify({ attendeeId }),
      })
      load()
    } catch {
      // no-op
    }
  }

  const startEdit = (a) => {
    setEditingId(a.id)
    setEditFullName(a.fullName || '')
    setEditLabel(a.label || '')
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditFullName('')
    setEditLabel('')
  }

  const saveEdit = async () => {
    if (!user || !editingId) return
    try {
      await authFetch(`/api/attendees/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ fullName: editFullName, label: editLabel }),
      })
      cancelEdit()
      load()
    } catch {
      // no-op
    }
  }

  const removeAttendee = async (attendeeId) => {
    if (!user) return
    if (!window.confirm('¿Eliminar este asistente?')) return
    try {
      await authFetch(`/api/attendees/${attendeeId}`, { method: 'DELETE' })
      load()
    } catch {
      // no-op
    }
  }

  return (
    <div className="mi-evento-page">
      <div className="page-title-block">
        <div className="badge-gradient">Asistentes</div>
        <h1 style={{ marginTop: '0.5rem' }}>Listado por evento</h1>
        <p>Verificá, editá o eliminá entradas emitidas.</p>
      </div>

      <section className="mi-evento-list-section">
        {loading && <p className="empty">Cargando...</p>}
        {error && <p className="empty">{error}</p>}
        {(!loading && (!attendees || attendees.length === 0)) ? (
          <div className="empty-state">
            <p>Aún no hay asistentes registrados.</p>
          </div>
        ) : (
          !loading && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {editingId === a.id ? (
                          <input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} placeholder="Nombre completo" />
                        ) : (
                          <strong>{a.fullName}</strong>
                        )}
                      </td>
                      <td>
                        {editingId === a.id ? (
                          <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Etiqueta" />
                        ) : (
                          <span className="badge assigned">{a.label || 'Free Pass'}</span>
                        )}
                      </td>
                      <td>
                        {a.verified ? (
                          <span className="badge assigned">Verificado</span>
                        ) : (
                          <span className="badge available">Pendiente</span>
                        )}
                      </td>
                      <td>
                        <div className="icon-actions">
                          {!a.verified && (
                            <button type="button" title="Verificar" className="icon-btn" onClick={() => verify(a.id)}>
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {editingId === a.id ? (
                            <>
                              <button type="button" title="Guardar" className="icon-btn" onClick={saveEdit}>
                                <Save size={16} />
                              </button>
                              <button type="button" title="Cancelar" className="icon-btn" onClick={cancelEdit}>
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button type="button" title="Editar" className="icon-btn" onClick={() => startEdit(a)}>
                                <Pencil size={16} />
                              </button>
                              <button type="button" title="Eliminar" className="icon-btn danger" onClick={() => removeAttendee(a.id)}>
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>
    </div>
  )
}
