import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { QrCode, Calendar, Home, Scan, MessageCircle, Camera, Users } from 'lucide-react'
import '../styles/Navbar.css'

const Navbar = () => {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <QrCode size={24} />
          <span>QR Eventos</span>
        </Link>
        
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              <Home size={20} />
              <span>Inicio</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/eventos" className={`nav-link ${isActive('/eventos')}`}>
              <Calendar size={20} />
              <span>Eventos</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/entrada-whatsapp" className={`nav-link ${isActive('/entrada-whatsapp')}`}>
              <MessageCircle size={20} />
              <span>Entrada WhatsApp</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/generar-qr" className={`nav-link ${isActive('/generar-qr')}`}>
              <QrCode size={20} />
              <span>Generar QR</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/escanear-qr" className={`nav-link ${isActive('/escanear-qr')}`}>
              <Scan size={20} />
              <span>Escanear QR</span>
            </Link>
          </li>
                        <li className="nav-item">
                <Link to="/escanear-entrada" className={`nav-link ${isActive('/escanear-entrada')}`}>
                  <Scan size={20} />
                  <span>Escanear Entrada</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/lista-asistentes" className={`nav-link ${isActive('/lista-asistentes')}`}>
                  <Users size={20} />
                  <span>Lista Asistentes</span>
                </Link>
              </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar 