import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { QrCode, Calendar, Home, Scan, MessageCircle } from 'lucide-react'
import '../styles/TabBar.css'

const TabBar = () => {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <nav className="tab-bar">
      <div className="tab-bar-container">
        <Link to="/" className={`tab-item ${isActive('/')}`}>
          <Home size={24} />
          <span>Inicio</span>
        </Link>
        
        <Link to="/eventos" className={`tab-item ${isActive('/eventos')}`}>
          <Calendar size={24} />
          <span>Eventos</span>
        </Link>
        
        <Link to="/generar-qr" className={`tab-item ${isActive('/generar-qr')}`}>
          <QrCode size={24} />
          <span>Generar QR</span>
        </Link>
        
        <Link to="/escanear-qr" className={`tab-item ${isActive('/escanear-qr')}`}>
          <Scan size={24} />
          <span>Escanear</span>
        </Link>
        
        <Link to="/entrada-whatsapp" className={`tab-item ${isActive('/entrada-whatsapp')}`}>
          <MessageCircle size={24} />
          <span>WhatsApp</span>
        </Link>
      </div>
    </nav>
  )
}

export default TabBar 