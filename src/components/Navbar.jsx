import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import ThemeToggle from './ThemeToggle'
import '../styles/Navbar.css'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const isLogin = location.pathname === '/login'

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img
            src="/images/ticketfest-logo.png"
            alt="TicketFest"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = '/images/merlo-baila-silber-logo.png'
            }}
          />
        </Link>

        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle />
          {!user ? (
            !isLogin && (
              <Link to="/login" className="btn btn-primary btn-sm">
                Iniciar sesión
              </Link>
            )
          ) : (
            <>
              <Link to="/dashboard" className="btn-icon" title="Dashboard">
                <User size={18} />
              </Link>
              <button
                type="button"
                className="btn-icon"
                title="Salir"
                onClick={() => {
                  signOut()
                  navigate('/', { replace: true })
                }}
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
