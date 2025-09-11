import React, { useState } from 'react'
import QRCode from 'qrcode.react'
import { Download, Copy, QrCode } from 'lucide-react'
import '../styles/GenerarQR.css'

const GenerarQR = () => {
  const [qrData, setQrData] = useState({
    evento: '',
    fecha: '',
    hora: '',
    ubicacion: '',
    capacidad: '',
    descripcion: ''
  })
  const [qrValue, setQrValue] = useState('')
  const [showQR, setShowQR] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setQrData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const generarQR = () => {
    const data = {
      ...qrData,
      timestamp: new Date().toISOString(),
      tipo: 'evento'
    }
    setQrValue(JSON.stringify(data))
    setShowQR(true)
  }

  const descargarQR = () => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const link = document.createElement('a')
      link.download = `qr-${qrData.evento.replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  const copiarDatos = () => {
    navigator.clipboard.writeText(qrValue)
    alert('Datos copiados al portapapeles')
  }

  const limpiarFormulario = () => {
    setQrData({
      evento: '',
      fecha: '',
      hora: '',
      ubicacion: '',
      capacidad: '',
      descripcion: ''
    })
    setQrValue('')
    setShowQR(false)
  }

  return (
    <div className="generar-qr">
      <div className="generar-qr-header">
        <h1>Generar Código QR</h1>
        <p>Crea códigos QR personalizados para tus eventos</p>
      </div>

      <div className="generar-qr-content">
        <div className="form-section">
          <h2>Información del Evento</h2>
          <form className="qr-form">
            <div className="form-group">
              <label htmlFor="evento">Nombre del Evento *</label>
              <input
                type="text"
                id="evento"
                name="evento"
                value={qrData.evento}
                onChange={handleInputChange}
                placeholder="Ej: Conferencia Tech 2024"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fecha">Fecha *</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={qrData.fecha}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="hora">Hora *</label>
                <input
                  type="time"
                  id="hora"
                  name="hora"
                  value={qrData.hora}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ubicacion">Ubicación *</label>
              <input
                type="text"
                id="ubicacion"
                name="ubicacion"
                value={qrData.ubicacion}
                onChange={handleInputChange}
                placeholder="Ej: Centro de Convenciones"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="capacidad">Capacidad</label>
              <input
                type="number"
                id="capacidad"
                name="capacidad"
                value={qrData.capacidad}
                onChange={handleInputChange}
                placeholder="Ej: 200"
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={qrData.descripcion}
                onChange={handleInputChange}
                placeholder="Descripción del evento..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={generarQR}
                disabled={!qrData.evento || !qrData.fecha || !qrData.hora || !qrData.ubicacion}
              >
                <QrCode size={20} />
                Generar QR
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={limpiarFormulario}
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>

        <div className="qr-section">
          <h2>Código QR</h2>
          {showQR && qrValue ? (
            <div className="qr-display">
              <div className="qr-container">
                <QRCode
                  value={qrValue}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="qr-actions">
                <button className="btn btn-secondary" onClick={descargarQR}>
                  <Download size={16} />
                  Descargar
                </button>
                <button className="btn btn-outline" onClick={copiarDatos}>
                  <Copy size={16} />
                  Copiar Datos
                </button>
              </div>
              <div className="qr-info">
                <h4>Información del QR:</h4>
                <pre className="qr-data">{qrValue}</pre>
              </div>
            </div>
          ) : (
            <div className="qr-placeholder">
              <QrCode size={64} />
              <p>Completa el formulario y genera tu código QR</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GenerarQR 