import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import '../styles/Login.css'
import { useAuth, consumeLoginReason } from '../auth/AuthProvider'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    if (consumeLoginReason() === 'session_expired') {
      setSessionExpired(true)
    }
  }, [])

  const handleSuccess = (credentialResponse) => {
    try {
      const { credential } = credentialResponse || {}
      if (!credential) return
      const payload = jwtDecode(credential)
      const normalizedUser = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        idToken: credential,
      }
      setUser(normalizedUser)
      navigate(from, { replace: true })
    } catch {
      // no-op
    }
  }

  return (
    <div className="login-page">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="login-card">
        <img
          className="login-logo"
          src="/images/ticketfest-logo.png"
          alt="TicketFest"
          onError={(e) => { e.currentTarget.src = '/images/merlo-baila-silber-logo.png' }}
        />
        <div className="badge-gradient login-badge">Organizadores</div>
        <h1>Bienvenido</h1>
        {sessionExpired && (
          <p className="login-expired">
            Tu sesión expiró. Volvé a iniciar sesión con Google para continuar.
          </p>
        )}
        <p>Iniciá sesión para gestionar tus eventos y entradas.</p>
        <div className="login-actions">
          {clientId ? (
            <GoogleLogin onSuccess={handleSuccess} onError={() => {}} type="standard" shape="pill" />
          ) : (
            <div style={{ color: '#b45309', background: '#fef3c7', padding: '0.75rem 1rem', borderRadius: 8 }}>
              Falta configurar VITE_GOOGLE_CLIENT_ID para habilitar Google Login.
            </div>
          )}
        </div>
        <p className="login-hint">Sesión segura con Google OAuth.</p>
      </div>
    </div>
  )
}
