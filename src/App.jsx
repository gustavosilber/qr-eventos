import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Eventos from './pages/Eventos'
import GenerarQR from './pages/GenerarQR'
import EscanearQR from './pages/EscanearQR'
import EscanearEntrada from './pages/EscanearEntrada'
import ListaAsistentes from './pages/ListaAsistentes'
import TestCameraPage from './pages/TestCameraPage'
import SimpleCameraPage from './pages/SimpleCameraPage'
import BasicCameraPage from './pages/BasicCameraPage'
import ImmediateCameraPage from './pages/ImmediateCameraPage'
import DirectCameraPage from './pages/DirectCameraPage'
import EntradaWhatsApp from './pages/EntradaWhatsApp'
import './styles/App.css'

function App() {
  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/generar-qr" element={<GenerarQR />} />
          <Route path="/escanear-qr" element={<EscanearQR />} />
          <Route path="/escanear-entrada" element={<EscanearEntrada />} />
        <Route path="/lista-asistentes" element={<ListaAsistentes />} />
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