import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  Users,
  ScanLine,
  Search,
  Menu,
  X,
  LogOut,
  Pencil,
  Ticket,
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import ThemeToggle from './ThemeToggle'
import '../styles/layout.css'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mi-evento', icon: PlusCircle, label: 'Crear evento' },
  { to: '/estadisticas', icon: BarChart3, label: 'Estadísticas' },
  { to: '/escanear-entrada', icon: ScanLine, label: 'Control Puerta' },
]

export default function ShellLayout({ children }) {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const eventMatch = location.pathname.match(/^\/event\/([^/]+)/)
  const eventId = eventMatch?.[1]

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(to + '/')

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-shell">
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside className={`shell-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/dashboard" onClick={closeSidebar}>
            <img
              src="/images/ticketfest-logo.png"
              alt="TicketFest"
              onError={(e) => {
                e.currentTarget.src = '/images/merlo-baila-silber-logo.png'
              }}
            />
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menú</div>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`sidebar-link${isActive(to) ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          ))}

          {eventId && (
            <>
              <div className="sidebar-section-label">Evento actual</div>
              <Link
                to={`/event/${eventId}/edit`}
                className={`sidebar-link${location.pathname.includes('/edit') ? ' active' : ''}`}
                onClick={closeSidebar}
              >
                <Pencil />
                <span>Editar evento</span>
              </Link>
              <Link
                to={`/event/${eventId}/attendees`}
                className={`sidebar-link${location.pathname.includes('/attendees') ? ' active' : ''}`}
                onClick={closeSidebar}
              >
                <Users />
                <span>Asistentes</span>
              </Link>
              <Link
                to={`/event/${eventId}/issue`}
                className={`sidebar-link${location.pathname.includes('/issue') ? ' active' : ''}`}
                onClick={closeSidebar}
              >
                <Ticket />
                <span>Emitir entrada</span>
              </Link>
              <Link
                to={`/event/${eventId}/door`}
                className={`sidebar-link${location.pathname.includes('/door') ? ' active' : ''}`}
                onClick={closeSidebar}
              >
                <ScanLine />
                <span>Control puerta</span>
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              {user.picture && (
                <img src={user.picture} alt={user.name} />
              )}
              <div className="sidebar-user-info">
                <div className="name">{user.name}</div>
                <div className="email">{user.email}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Menú"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="topbar-search">
            <Search />
            <input placeholder="Buscar eventos, asistentes..." />
          </div>

          <div className="topbar-actions">
            <ThemeToggle />
            {user?.picture && (
              <img
                className="topbar-avatar"
                src={user.picture}
                alt={user.name}
                title={user.name}
              />
            )}
            <button
              type="button"
              className="topbar-icon-btn"
              onClick={() => {
                signOut()
                navigate('/login', { replace: true })
              }}
              title="Salir"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="shell-content">{children}</main>
      </div>
    </div>
  )
}
