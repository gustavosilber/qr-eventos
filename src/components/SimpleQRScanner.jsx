import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import jsQR from 'jsqr';
import '../styles/QRScanner.css';

const SimpleQRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Verificar soporte del navegador
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara');
      }

      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Usar cámara trasera en móviles
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
        };
        videoRef.current.oncanplay = () => {
          console.log('Video can play');
        };
        videoRef.current.play().then(() => {
          console.log('Video started successfully');
        }).catch(err => {
          console.error('Error playing video:', err);
        });
      }

      setScanning(true);
      setLoading(false);

      // Iniciar detección de QR
      startQRDetection();

    } catch (err) {
      console.error('Error starting camera:', err);
      setError(err.message || 'Error al acceder a la cámara');
      setLoading(false);
    }
  };

  const startQRDetection = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    const interval = setInterval(() => {
      if (!scanning) {
        clearInterval(interval);
        return;
      }

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        if (code) {
          console.log('QR Code detected:', code.data);
          handleScanSuccess(code.data, code);
          clearInterval(interval);
        }
      }
    }, 100); // Check every 100ms
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleScanSuccess = (decodedText, decodedResult) => {
    setResult({
      text: decodedText,
      data: decodedResult
    });
    stopCamera();
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
          <button onClick={startCamera} className="start-button">
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
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            <div className="qr-overlay">
              <div className="qr-frame"></div>
            </div>
          </div>
          <button onClick={stopCamera} className="stop-button">
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
          <button onClick={() => setError(null)} className="retry-button">
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
};

export default SimpleQRScanner; 