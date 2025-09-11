import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import '../styles/QRScanner.css';

const QRScanner = () => {
  const [scanner, setScanner] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const startScanner = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      // Verificar si el navegador soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara');
      }

      // Solicitar permisos de cámara primero
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      setScanning(true);
      setLoading(false);

      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [0, 1] // QR_CODE, AZTEC
        },
        false
      );

      html5QrcodeScanner.render((decodedText, decodedResult) => {
        handleScanSuccess(decodedText, decodedResult);
      }, (errorMessage) => {
        console.log('Scanner error:', errorMessage);
        // No mostrar errores menores del scanner
        if (errorMessage.includes('NotFound') || errorMessage.includes('NotAllowedError')) {
          setError('No se pudo acceder a la cámara. Verifica los permisos.');
        }
      });

      setScanner(html5QrcodeScanner);
      
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Error al iniciar el escáner');
      setLoading(false);
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setScanning(false);
  };

  const handleScanSuccess = (decodedText, decodedResult) => {
    setResult({
      text: decodedText,
      data: decodedResult
    });
    stopScanner();
  };

  const validateEntry = (qrData) => {
    // Aquí puedes agregar la lógica para validar la entrada
    // Por ejemplo, verificar si el QR es válido, si la entrada no ha expirado, etc.
    return {
      valid: true,
      message: "Entrada válida",
      eventName: "Evento de Prueba",
      attendeeName: "Usuario",
      date: new Date().toLocaleDateString()
    };
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="qr-scanner-container">
      <div className="scanner-header">
        <h2>Escanear Entrada QR</h2>
        <p>Coloca el código QR de la entrada frente a la cámara</p>
      </div>

      {!scanning && !result && !loading && (
        <div className="scanner-start">
          <div className="camera-icon">
            <Camera size={64} />
          </div>
          <button onClick={startScanner} className="start-button">
            Iniciar Escáner
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
          <div id="qr-reader" className="qr-reader"></div>
          <button onClick={stopScanner} className="stop-button">
            <X size={20} />
            Detener Escáner
          </button>
        </div>
      )}

      {result && (
        <div className="scan-result">
          <div className="result-header">
            <CheckCircle size={32} className="success-icon" />
            <h3>Código QR Detectado</h3>
          </div>
          
          <div className="result-content">
            <div className="qr-data">
              <strong>Datos del QR:</strong>
              <p>{result.text}</p>
            </div>
            
            <div className="validation-result">
              <strong>Validación de Entrada:</strong>
              <div className="validation-info">
                <p><strong>Evento:</strong> Evento de Prueba</p>
                <p><strong>Asistente:</strong> Usuario</p>
                <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Estado:</strong> <span className="valid">Válida</span></p>
              </div>
            </div>
          </div>

          <div className="result-actions">
            <button onClick={resetScanner} className="scan-again-button">
              Escanear Otro QR
            </button>
            <button className="confirm-button">
              Confirmar Entrada
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner; 