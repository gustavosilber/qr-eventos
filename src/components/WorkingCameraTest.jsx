import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Loader, CheckCircle, XCircle } from 'lucide-react';
import jsQR from 'jsqr';
import { findExactAttendee, markAttendeeAsVerified } from '../data/attendees';
import '../styles/QRScanner.css';

const WorkingCameraTest = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Efecto para manejar el video cuando cambia el estado
  useEffect(() => {
    if (scanning && streamRef.current && videoRef.current) {
      console.log('Setting up video element...');
      videoRef.current.srcObject = streamRef.current;
      
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded');
      };
      
      videoRef.current.oncanplay = () => {
        console.log('Video can play');
        startQRDetection();
      };
      
      videoRef.current.onplay = () => {
        console.log('Video is playing');
      };
      
      videoRef.current.onerror = (e) => {
        console.error('Video error:', e);
      };

      videoRef.current.play()
        .then(() => {
          console.log('Video play successful');
        })
        .catch(e => {
          console.error('Video play failed:', e);
        });
    }
  }, [scanning]);

  const startQRDetection = () => {
    console.log('Starting QR detection...');
    
    const detectQR = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        // Usar dimensiones fijas para mejor rendimiento
        canvas.width = 640;
        canvas.height = 480;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Intentar detección con diferentes configuraciones
        const detectionOptions = [
          { inversionAttempts: "dontInvert" },
          { inversionAttempts: "attemptBoth" },
          { inversionAttempts: "onlyInvert" }
        ];
        
        let qrDetected = false;
        
        for (const options of detectionOptions) {
          try {
            const code = jsQR(imageData.data, imageData.width, imageData.height, options);
            if (code) {
              console.log('QR Code detected with options:', options, 'Data:', code.data);
              handleScanSuccess(code.data, code);
              qrDetected = true;
              break;
            }
          } catch (error) {
            console.log('Error in QR detection with options:', options, error);
          }
        }
        
        // Solo incrementar intentos si no se detectó nada
        if (!qrDetected) {
          setScanAttempts(prev => {
            const newCount = prev + 1;
            // Resetear contador cada 200 intentos para evitar números muy grandes
            return newCount > 200 ? 0 : newCount;
          });
        } else {
          // Si se detectó, resetear contador
          setScanAttempts(0);
        }
      }
      
      // Continuar escaneando siempre que esté activo y no haya resultado
      if (scanning && !result) {
        animationFrameRef.current = requestAnimationFrame(detectQR);
      }
    };
    
    detectQR();
  };

  const handleScanSuccess = (decodedText, decodedResult) => {
    console.log('QR Raw data:', decodedText);
    
    // Parsear los datos del QR (asumiendo formato JSON)
    let qrData = {};
    try {
      qrData = JSON.parse(decodedText);
      console.log('Parsed QR data (JSON):', qrData);
      
      // Mapear campos del JSON a nuestro formato
      qrData = {
        nombre: qrData.nombre || qrData.name || "No especificado",
        apellido: qrData.apellido || qrData.lastName || qrData.apellidos || "",
        total: qrData.monto || qrData.total || qrData.amount || qrData.precio || "0",
        timestamp: qrData.timestamp || qrData.fecha || Date.now(),
        evento: qrData.evento || qrData.event || "",
        ubicacion: qrData.ubicacion || qrData.location || "",
        hora: qrData.hora || qrData.time || ""
      };
      
      console.log('Mapped QR data:', qrData);
    } catch (e) {
      console.log('Failed to parse JSON, extracting from raw text');
      // Si no es JSON, intentar extraer datos del texto de múltiples formas
      
      // Buscar montos con diferentes patrones
      const amountPatterns = [
        /\$(\d+(?:\.\d{2})?)/,  // $123.45
        /(\d+(?:\.\d{2})?)\s*pesos?/i,  // 123.45 pesos
        /total[:\s]*(\d+(?:\.\d{2})?)/i,  // total: 123.45
        /monto[:\s]*(\d+(?:\.\d{2})?)/i,  // monto: 123.45
        /(\d+(?:\.\d{2})?)/  // cualquier número con decimales
      ];
      
      let foundAmount = null;
      for (const pattern of amountPatterns) {
        const match = decodedText.match(pattern);
        if (match) {
          foundAmount = match[1];
          console.log('Found amount with pattern:', pattern, 'Value:', foundAmount);
          break;
        }
      }
      
      // Buscar nombres (asumiendo que están al principio)
      const words = decodedText.split(/\s+/);
      const name = words[0] || "Datos no estructurados";
      const lastName = words[1] || "";
      
      qrData = {
        nombre: name,
        apellido: lastName,
        total: foundAmount || "0",
        timestamp: Date.now()
      };
      
      console.log('Extracted data from text:', qrData);
    }

    // Asegurar que el total sea un número válido
    if (qrData.total) {
      const cleanTotal = qrData.total.toString().replace(/[^\d.]/g, '');
      qrData.total = cleanTotal || "0";
      console.log('Cleaned total:', qrData.total);
    }

    console.log('Final QR data:', qrData);

    // Verificar si el asistente está en la lista y marcarlo como verificado
    const fullName = `${qrData.nombre} ${qrData.apellido}`.trim();
    const foundAttendee = findExactAttendee(fullName);
    
    if (foundAttendee) {
      console.log('Asistente encontrado en la lista:', foundAttendee);
      markAttendeeAsVerified(foundAttendee);
    } else {
      console.log('Asistente no encontrado en la lista:', fullName);
    }

    setResult({
      text: decodedText,
      data: decodedResult,
      parsedData: qrData,
      attendeeFound: foundAttendee
    });
    setShowModal(true);
    stopCamera();
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    setShowModal(false);
    setScanAttempts(0);
    setLastDetectionTime(0);
  };

  const formatCurrency = (amount) => {
    console.log('Formatting amount:', amount, 'Type:', typeof amount);
    
    if (!amount || amount === "0") return "0";
    
    // Mostrar el monto tal como está en el QR
    return amount.toString();
  };

  const startCamera = () => {
    console.log('Starting camera...');
    setLoading(true);
    setError(null);

    // Configuración simplificada para mejor compatibilidad
    const constraints = {
      video: {
        width: { ideal: 640, min: 320 },
        height: { ideal: 480, min: 240 },
        facingMode: 'environment' // Usar cámara trasera en móviles
      }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        console.log('Stream obtained:', stream);
        console.log('Stream tracks:', stream.getTracks());
        console.log('Stream active:', stream.active);
        
        streamRef.current = stream;
        setScanning(true);
        setLoading(false);
        console.log('Camera started successfully');
      })
      .catch(err => {
        console.error('Camera error:', err);
        setError(err.message || 'Error al acceder a la cámara');
        setLoading(false);
      });
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  return (
    <div className="qr-scanner-container">
                <div className="scanner-header">
            <h2>Escanear Entrada QR</h2>
            <p>Coloca el código QR de la entrada frente a la cámara</p>
            <div className="scanner-tips">
              <p>💡 <strong>Consejos:</strong></p>
              <ul>
                <li>Mantén el QR estable y bien iluminado</li>
                <li>Acerca el QR a la cámara (15-30 cm)</li>
                <li>Evita sombras y reflejos</li>
              </ul>
            </div>
          </div>

      {!scanning && !loading && (
                  <div className="scanner-start">
            <div className="camera-icon">
              <Camera size={64} />
            </div>
            <button onClick={startCamera} className="start-button">
              Iniciar Escáner
            </button>
            <button 
              onClick={() => {
                const testQR = JSON.stringify({
                  nombre: "FABIANA ROBLEDO",
                  monto: "15.000",
                  timestamp: new Date().toISOString(),
                  evento: "MERLO BAILA SILBER Edition"
                });
                handleScanSuccess(testQR, { data: testQR });
              }} 
              className="test-button"
            >
              Probar con QR de Test
            </button>
          </div>
      )}

      {loading && (
        <div className="scanner-loading">
          <div className="loading-icon">
            <Loader size={48} className="spinning" />
          </div>
          <p>Iniciando cámara...</p>
        </div>
      )}

      {scanning && (
        <div className="scanner-active">
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                backgroundColor: '#000'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
                                      <div className="qr-overlay">
              <div className="qr-frame">
                <div className="scan-indicator"></div>
              </div>
              <div className="scan-text">
                Escaneando... (Intentos: {scanAttempts})
              </div>
            </div>
            <div className="scanner-controls">
              <button 
                onClick={() => {
                  setScanAttempts(0);
                  console.log('Scanner reset manually');
                }} 
                className="reset-scanner-button"
              >
                Reiniciar Escáner
              </button>
            </div>
          </div>
          <button onClick={stopCamera} className="stop-button">
            <X size={20} />
            Detener Escáner
          </button>
        </div>
      )}



      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="retry-button">
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Modal Popup */}
      {showModal && result && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className={`qr-ticket ${result.attendeeFound ? 'valid' : 'invalid'}`}>
              <div className="ticket-header">
                {result.attendeeFound ? (
                  <CheckCircle size={48} className="success-icon" />
                ) : (
                  <XCircle size={48} className="error-icon" />
                )}
                <h2>ENTRADA LEÍDA</h2>
                <div className={`ticket-status ${result.attendeeFound ? 'confirmed' : 'invalid'}`}>
                  {result.attendeeFound ? '✓ CONFIRMADA' : '✗ INVÁLIDA'}
                </div>
                {result.attendeeFound && (
                  <div className="attendee-status">
                    <span className="status-badge verified">✓ En lista de asistentes</span>
                  </div>
                )}
                {!result.attendeeFound && (
                  <div className="attendee-status">
                    <span className="status-badge not-found">⚠ No encontrado en lista</span>
                  </div>
                )}
              </div>
              
                                <div className="ticket-content">
                    <div className="ticket-section">
                      <div className="ticket-field">
                        <label>NOMBRE Y APELLIDO</label>
                        <div className="field-value">
                          {result.parsedData.nombre || "No especificado"} {result.parsedData.apellido || ""}
                        </div>
                      </div>
                      
                      <div className="ticket-field">
                        <label>FECHA DE GENERACIÓN</label>
                        <div className="field-value">
                          {result.parsedData.timestamp ? 
                            new Date(result.parsedData.timestamp).toLocaleString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 
                            "No especificada"
                          }
                        </div>
                      </div>
                      
                      <div className="ticket-field">
                        <label>TOTAL ABONADO</label>
                        <div className="field-value amount">
                          ${formatCurrency(result.parsedData.total)}
                        </div>
                      </div>
                    </div>
                  </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkingCameraTest; 