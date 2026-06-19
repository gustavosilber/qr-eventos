import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Eventos from './pages/Eventos'
import GenerarQR from './pages/GenerarQR'
import EscanearEntrada from './pages/EscanearEntrada'
import ListaAsistentes from './pages/ListaAsistentes'
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
  const isPagar = location.pathname === '/pagar'

  return (
    <div className="App">
      {!isPagar && <Navbar />}
      <main className={`main-content${isPagar ? ' no-navbar pagar-background' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/generar-qr" element={<GenerarQR />} />
          <Route path="/escanear-entrada" element={<EscanearEntrada />} />
        <Route path="/lista-asistentes" element={<ListaAsistentes />} />
          <Route path="/pagar" element={<Pagar />} />
          <Route path="/test-camera" element={<TestCameraPage />} />
          <Route path="/simple-camera" element={<SimpleCameraPage />} />
          <Route path="/basic-camera" element={<BasicCameraPage />} />
          <Route path="/immediate-camera" element={<ImmediateCameraPage />} />
          <Route path="/direct-camera" element={<DirectCameraPage />} />
          <Route path="/entrada-whatsapp" element={<EntradaWhatsApp />} />
        </Routes>
      </main>
    </div>
  )
}

export default App 