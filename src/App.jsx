import React from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ShellLayout from './components/ShellLayout'
import Home from './pages/Home'
import Eventos from './pages/Eventos'
import GenerarQR from './pages/GenerarQR'
import EscanearEntrada from './pages/EscanearEntrada'
import ListaAsistentes from './pages/ListaAsistentes'
import Login from './pages/Login'
import MiEvento from './pages/MiEvento'
import Dashboard from './pages/Dashboard'
import Estadisticas from './pages/Estadisticas'
import EditarEvento from './pages/EditarEvento'
import AsistentesEvento from './pages/AsistentesEvento'
import EmitirEntrada from './pages/EmitirEntrada'
import ControlPuertaEvento from './pages/ControlPuertaEvento'
import EventoPublico from './pages/EventoPublico'
import EntradaPublica from './pages/EntradaPublica'
import RequireAuth from './routes/RequireAuth'
import Pagar from './pages/Pagar'
import TestCameraPage from './pages/TestCameraPage'
import SimpleCameraPage from './pages/SimpleCameraPage'
import BasicCameraPage from './pages/BasicCameraPage'
import ImmediateCameraPage from './pages/ImmediateCameraPage'
import DirectCameraPage from './pages/DirectCameraPage'
import EntradaWhatsApp from './pages/EntradaWhatsApp'
import './styles/App.css'

function App() {
  const location = useLocation()
  const isPublicStore = location.pathname.startsWith('/e/')
  const isPublicTicket = location.pathname.startsWith('/entrada/')
  const isPagar = location.pathname === '/pagar'
  const isLogin = location.pathname === '/login'
  const isShell =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/mi-evento') ||
    location.pathname.startsWith('/estadisticas') ||
    location.pathname.startsWith('/event/') ||
    location.pathname.startsWith('/lista-asistentes') ||
    location.pathname.startsWith('/escanear-entrada')

  return (
    <div className="App">
      {!isPagar && !isShell && !isLogin && !isPublicStore && !isPublicTicket && <Navbar />}
      <main className={`main-content${isPagar || isLogin || isPublicStore || isPublicTicket ? ' no-navbar' : ''}${isPagar ? ' pagar-background' : ''}${isShell ? ' shell-mode' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/generar-qr" element={<GenerarQR />} />
          <Route
            path="/escanear-entrada"
            element={
              <RequireAuth>
                <ShellLayout>
                  <EscanearEntrada />
                </ShellLayout>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <ShellLayout>
                  <Dashboard />
                </ShellLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/estadisticas"
            element={
              <RequireAuth>
                <ShellLayout>
                  <Estadisticas />
                </ShellLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/mi-evento"
            element={
              <RequireAuth>
                <ShellLayout>
                  <MiEvento />
                </ShellLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/event/:id/edit"
            element={
              <RequireAuth>
                <ShellLayout>
                  <EditarEvento />
                </ShellLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/event/:id/attendees"
            element={
              <RequireAuth>
                <ShellLayout>
                  <AsistentesEvento />
                </ShellLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/event/:id/issue"
            element={
              <RequireAuth>
                <ShellLayout>
                  <EmitirEntrada />
                </ShellLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/event/:id/door"
            element={
              <RequireAuth>
                <ShellLayout>
                  <ControlPuertaEvento />
                </ShellLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/lista-asistentes"
            element={
              <RequireAuth>
                <ShellLayout>
                  <ListaAsistentes />
                </ShellLayout>
              </RequireAuth>
            }
          />
          <Route path="/pagar" element={<Pagar />} />
          <Route path="/e/:slug" element={<EventoPublico />} />
          <Route path="/entrada/:token" element={<EntradaPublica />} />
          <Route path="/test-camera" element={<TestCameraPage />} />
          <Route path="/simple-camera" element={<SimpleCameraPage />} />
          <Route path="/basic-camera" element={<BasicCameraPage />} />
          <Route path="/immediate-camera" element={<ImmediateCameraPage />} />
          <Route path="/direct-camera" element={<DirectCameraPage />} />
          <Route path="/entrada-whatsapp" element={<EntradaWhatsApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App 