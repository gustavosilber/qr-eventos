import React, { useState, useRef } from 'react'
import QRCode from 'qrcode.react'
import { Download, Share2, QrCode } from 'lucide-react'
import html2canvas from 'html2canvas'
import '../styles/EntradaWhatsApp.css'

const EntradaWhatsApp = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    monto: ''
  })
  const [showTicket, setShowTicket] = useState(false)
  const ticketRef = useRef(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const generarEntrada = () => {
    if (formData.nombre && formData.apellido && formData.monto) {
      setShowTicket(true)
    }
  }

  const descargarEntrada = async () => {
    if (ticketRef.current) {
      try {
        console.log('Iniciando descarga...')
        
        // Esperar un poco para que el DOM se renderice completamente
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const canvas = await html2canvas(ticketRef.current, {
          backgroundColor: '#25d366',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: ticketRef.current.offsetWidth,
          height: ticketRef.current.offsetHeight
        })
        
        const link = document.createElement('a')
        link.download = `entrada-${formData.nombre}-${formData.apellido}.png`
        link.href = canvas.toDataURL('image/png', 1.0)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        alert('¡Entrada descargada exitosamente!')
      } catch (error) {
        console.error('Error al descargar la entrada:', error)
        alert('Error al descargar la entrada. Inténtalo de nuevo.')
      }
    } else {
      console.error('No se encontró el elemento de la entrada')
      alert('Error: No se pudo generar la entrada.')
    }
  }

  const compartirWhatsApp = async () => {
    if (ticketRef.current) {
      try {
        console.log('Iniciando compartir...')
        
        // Esperar un poco para que el DOM se renderice completamente
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const canvas = await html2canvas(ticketRef.current, {
          backgroundColor: '#25d366',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: ticketRef.current.offsetWidth,
          height: ticketRef.current.offsetHeight
        })
        
        canvas.toBlob(blob => {
          const text = `¡Entrada confirmada para MERLO BAILA SILBER Edition! 🎉`
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
          window.open(whatsappUrl, '_blank')
        }, 'image/png', 1.0)
      } catch (error) {
        console.error('Error al compartir:', error)
        alert('Error al compartir. Inténtalo de nuevo.')
      }
    } else {
      console.error('No se encontró el elemento de la entrada')
      alert('Error: No se pudo generar la entrada.')
    }
  }

  const qrData = {
    evento: 'MERLO BAILA SILBER Edition',
    fecha: '2024-09-27',
    hora: '22:00',
    ubicacion: 'Merlo Mutiespacio, Merlo - San Luis',
    nombre: `${formData.nombre} ${formData.apellido}`,
    monto: formData.monto,
    timestamp: new Date().toISOString()
  }

  return (
    <div className="entrada-whatsapp">
      <div className="entrada-header">
        <h1>Generar Entrada - MERLO BAILA SILBER Edition</h1>
        <p>Crea entradas con formato de WhatsApp para el evento</p>
      </div>

      <div className="entrada-content">
        <div className="form-section">
          <h2>Datos del Asistente</h2>
          <form className="entrada-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ingresa el nombre"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                placeholder="Ingresa el apellido"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="monto">Monto Abonado *</label>
              <input
                type="number"
                id="monto"
                name="monto"
                value={formData.monto}
                onChange={handleInputChange}
                placeholder="Ingresa el monto"
                min="0"
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={generarEntrada}
                disabled={!formData.nombre || !formData.apellido || !formData.monto}
              >
                <QrCode size={20} />
                Generar Entrada
              </button>
            </div>
          </form>
        </div>

        <div className="ticket-section">
          <h2>Entrada WhatsApp</h2>
          {showTicket ? (
            <div className="ticket-container">
              <div className="whatsapp-ticket" ref={ticketRef}>
                <div className="ticket-header">
                  <div className="logo-container">
                    <img 
                      src="/images/merlo-baila-silber-logo.png" 
                      alt="MERLO BAILA SILBER Edition" 
                      className="event-logo"
                      onLoad={() => {
                        console.log('Logo cargado exitosamente');
                        console.log('Logo URL:', '/images/merlo-baila-silber-logo.png');
                      }}
                      onError={(e) => {
                        console.error('Error cargando logo:', e.target.src);
                        console.error('Intentando cargar desde:', window.location.origin + '/images/merlo-baila-silber-logo.png');
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                                                    <div className="logo-fallback">
                                  <div className="whatsapp-icon">📱</div>
                                </div>
                  </div>
                  <div className="ticket-title">
                    <h3>MERLO BAILA SILBER Edition</h3>
                    <p className="ticket-date">27 de septiembre / 22hs.</p>
                  </div>
                </div>

                <div className="ticket-content">
                  <div className="attendee-info">
                    <p className="attendee-name">
                      {formData.nombre} {formData.apellido}
                    </p>
                    <p className="ticket-price">
                      Total abonado: ${formData.monto}
                    </p>
                  </div>

                  <div className="qr-section">
                                                    <QRCode
                                  value={JSON.stringify(qrData)}
                                  size={216}
                                  level="H"
                                  includeMargin={true}
                                />
                  </div>
                </div>

                <div className="ticket-footer">
                  <p>📍 Merlo Mutiespacio</p>
                  <p>📍 Merlo - San Luis</p>
                  <p>🎫 Entrada válida para una persona</p>
                </div>
              </div>

              <div className="ticket-actions">
                <button className="btn btn-secondary" onClick={descargarEntrada}>
                  <Download size={16} />
                  Descargar
                </button>
                <button className="btn btn-primary" onClick={compartirWhatsApp}>
                  <Share2 size={16} />
                  Compartir WhatsApp
                </button>
              </div>
            </div>
          ) : (
            <div className="ticket-placeholder">
              <QrCode size={64} />
              <p>Completa el formulario para generar la entrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EntradaWhatsApp 