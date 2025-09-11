import React from 'react'
import { Link } from 'react-router-dom'
import { QrCode, Calendar, Users, CheckCircle } from 'lucide-react'
import '../styles/Home.css'

const Home = () => {
  return (
    <div className="home">
      <div className="hero-section">
        <h1>Bienvenido a QR Eventos</h1>
        <p className="hero-subtitle">
          Sistema completo para la gestión de eventos con códigos QR
        </p>
        <div className="hero-actions">
          <Link to="/generar-qr" className="btn btn-primary">
            <QrCode size={20} />
            Generar QR
          </Link>
          <Link to="/escanear-qr" className="btn btn-secondary">
            <QrCode size={20} />
            Escanear QR
          </Link>
        </div>
      </div>

      <div className="features-section">
        <h2>Características Principales</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <QrCode size={32} />
            </div>
            <h3>Generación de QR</h3>
            <p>Crea códigos QR personalizados para tus eventos con información detallada.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Calendar size={32} />
            </div>
            <h3>Gestión de Eventos</h3>
            <p>Organiza y administra todos tus eventos desde una interfaz intuitiva.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Users size={32} />
            </div>
            <h3>Control de Asistencia</h3>
            <p>Registra y controla la asistencia de los participantes en tiempo real.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <CheckCircle size={32} />
            </div>
            <h3>Verificación Rápida</h3>
            <p>Escanear códigos QR para verificar la validez de las entradas instantáneamente.</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>¿Listo para empezar?</h2>
        <p>Comienza a crear y gestionar tus eventos con códigos QR</p>
        <Link to="/eventos" className="btn btn-primary">
          Ver Eventos
        </Link>
      </div>
    </div>
  )
}

export default Home 