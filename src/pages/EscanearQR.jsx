import React, { useState } from 'react'
import { Scan, CheckCircle, XCircle } from 'lucide-react'
import '../styles/EscanearQR.css'

const EscanearQR = () => {
  const [scannedData, setScannedData] = useState(null)
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = () => {
    setIsScanning(true)
    // Simulación de escaneo
    setTimeout(() => {
      const mockData = {
        evento: 'MERLO BAILA SILBER Edition',
        fecha: '2024-09-27',
        hora: '22:00',
        ubicacion: 'Merlo, San Luis',
        nombre: 'Juan Pérez',
        monto: 5000
      }
      setScannedData(mockData)
      setIsScanning(false)
    }, 2000)
  }

  return (
    <div className="escanear-qr">
      <div className="escanear-qr-header">
        <h1>Escanear Código QR</h1>
        <p>Verifica la validez de las entradas escaneando códigos QR</p>
      </div>

      <div className="scanner-section">
        <div className="scanner-container">
          {!isScanning && !scannedData && (
            <div className="scanner-placeholder">
              <Scan size={64} />
              <h3>Escanear QR</h3>
              <p>Coloca el código QR dentro del área de escaneo</p>
              <button className="btn btn-primary" onClick={handleScan}>
                <Scan size={20} />
                Iniciar Escaneo
              </button>
            </div>
          )}

          {isScanning && (
            <div className="scanner-active">
              <div className="scanner-frame">
                <Scan size={48} className="scanning-icon" />
                <p>Escaneando...</p>
              </div>
            </div>
          )}

          {scannedData && (
            <div className="scan-result">
              <div className="result-header">
                <CheckCircle size={32} className="success-icon" />
                <h3>Entrada Válida</h3>
              </div>
              
              <div className="result-details">
                <div className="detail-item">
                  <strong>Evento:</strong> {scannedData.evento}
                </div>
                <div className="detail-item">
                  <strong>Fecha:</strong> {scannedData.fecha}
                </div>
                <div className="detail-item">
                  <strong>Hora:</strong> {scannedData.hora}
                </div>
                <div className="detail-item">
                  <strong>Ubicación:</strong> {scannedData.ubicacion}
                </div>
                <div className="detail-item">
                  <strong>Nombre:</strong> {scannedData.nombre}
                </div>
                <div className="detail-item">
                  <strong>Monto:</strong> ${scannedData.monto}
                </div>
              </div>

              <button 
                className="btn btn-primary"
                onClick={() => {
                  setScannedData(null)
                  setIsScanning(false)
                }}
              >
                Escanear Otro QR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EscanearQR 