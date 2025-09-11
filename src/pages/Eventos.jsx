import React, { useState } from 'react'
import { Plus, Calendar, MapPin, Users, QrCode } from 'lucide-react'
import '../styles/Eventos.css'

const Eventos = () => {
  const [eventos, setEventos] = useState([
    {
      id: 1,
      nombre: 'Conferencia Tech 2024',
      fecha: '2024-03-15',
      hora: '18:00',
      ubicacion: 'Centro de Convenciones',
      capacidad: 200,
      asistentes: 150,
      estado: 'activo'
    },
    {
      id: 2,
      nombre: 'Workshop de React',
      fecha: '2024-03-20',
      hora: '14:00',
      ubicacion: 'Espacio Coworking',
      capacidad: 50,
      asistentes: 45,
      estado: 'activo'
    },
    {
      id: 3,
      nombre: 'Meetup de Startups',
      fecha: '2024-03-25',
      hora: '19:00',
      ubicacion: 'Café Central',
      capacidad: 80,
      asistentes: 0,
      estado: 'pendiente'
    }
  ])

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activo':
        return 'estado-activo'
      case 'pendiente':
        return 'estado-pendiente'
      case 'finalizado':
        return 'estado-finalizado'
      default:
        return ''
    }
  }

  const getEstadoText = (estado) => {
    switch (estado) {
      case 'activo':
        return 'Activo'
      case 'pendiente':
        return 'Pendiente'
      case 'finalizado':
        return 'Finalizado'
      default:
        return estado
    }
  }

  return (
    <div className="eventos">
      <div className="eventos-header">
        <h1>Gestión de Eventos</h1>
        <button className="btn btn-primary">
          <Plus size={20} />
          Nuevo Evento
        </button>
      </div>

      <div className="eventos-grid">
        {eventos.map((evento) => (
          <div key={evento.id} className="evento-card">
            <div className="evento-header">
              <h3>{evento.nombre}</h3>
              <span className={`estado ${getEstadoColor(evento.estado)}`}>
                {getEstadoText(evento.estado)}
              </span>
            </div>

            <div className="evento-info">
              <div className="info-item">
                <Calendar size={16} />
                <span>{evento.fecha} - {evento.hora}</span>
              </div>
              <div className="info-item">
                <MapPin size={16} />
                <span>{evento.ubicacion}</span>
              </div>
              <div className="info-item">
                <Users size={16} />
                <span>{evento.asistentes} / {evento.capacidad} asistentes</span>
              </div>
            </div>

            <div className="evento-actions">
              <button className="btn btn-secondary">
                <QrCode size={16} />
                Generar QR
              </button>
              <button className="btn btn-outline">
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {eventos.length === 0 && (
        <div className="empty-state">
          <Calendar size={64} />
          <h3>No hay eventos creados</h3>
          <p>Crea tu primer evento para comenzar a usar el sistema de códigos QR</p>
          <button className="btn btn-primary">
            <Plus size={20} />
            Crear Evento
          </button>
        </div>
      )}
    </div>
  )
}

export default Eventos 