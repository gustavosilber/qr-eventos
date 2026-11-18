import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Calendar, Sparkles, QrCode, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import '../styles/Home.css'

const Home = () => {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="home-page">
      <section className="hero-premium home-hero">
        <div className="container-xl hero-grid">
          <div className="hero-copy">
            <div className="badge-gradient">
              <Sparkles size={12} style={{ marginRight: 4 }} />
              TicketFest
            </div>
            <h1 className="heading-hero">
              Gestioná eventos como un profesional
            </h1>
            <p className="subtitle">
              Entradas digitales, control de acceso en puerta y estadísticas en tiempo real. Todo en una plataforma premium.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary btn-large">
                Empezar gratis
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                Iniciar sesión
              </Link>
            </div>
            <div className="hero-stats">
              <div><strong>QR</strong><span>Acceso instantáneo</span></div>
              <div><strong>Free Pass</strong><span>Invitados VIP</span></div>
              <div><strong>Live</strong><span>Control puerta</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card-stack">
              <div className="hero-float-card card-1">
                <QrCode size={28} />
                <span>Entrada emitida</span>
              </div>
              <div className="hero-float-card card-2">
                <ShieldCheck size={28} />
                <span>Verificado ✓</span>
              </div>
              <div className="hero-main-card">
                <img
                  src="/images/ticketfest-logo.png"
                  alt="TicketFest"
                  onError={(e) => { e.currentTarget.src = '/images/merlo-baila-silber-logo.png' }}
                />
                <p>Tu evento, bajo control</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container-xl">
          <h2 className="section-title">Todo lo que necesitás</h2>
          <div className="grid-cards">
            <div className="tile">
              <div className="tile-icon pink"><QrCode size={22} /></div>
              <h3>QR inteligente</h3>
              <p className="muted">Códigos únicos por entrada con verificación instantánea en puerta.</p>
            </div>
            <div className="tile">
              <div className="tile-icon purple"><Calendar size={22} /></div>
              <h3>Gestión de eventos</h3>
              <p className="muted">Tarifas, Free Pass y asistentes en una interfaz moderna.</p>
            </div>
            <div className="tile">
              <div className="tile-icon green"><ShieldCheck size={22} /></div>
              <h3>Control de acceso</h3>
              <p className="muted">Escaneá entradas desde el celular y evitá filas en la puerta.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
