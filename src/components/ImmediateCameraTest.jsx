import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader } from 'lucide-react';
import '../styles/QRScanner.css';

const ImmediateCameraTest = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = () => {
    console.log('Starting camera...');
    setLoading(true);
    setError(null);

    // Configuración muy básica
    const constraints = {
      video: true
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        console.log('Stream obtained:', stream);
        streamRef.current = stream;
        
        if (videoRef.current) {
          console.log('Setting video srcObject...');
          videoRef.current.srcObject = stream;
          console.log('Video srcObject set');
          
          // Mostrar el video inmediatamente
          setScanning(true);
          setLoading(false);
          console.log('Video should be visible now');
          
          // Intentar reproducir en segundo plano
          videoRef.current.play()
            .then(() => console.log('Video play successful'))
            .catch(e => console.warn('Video play failed:', e));
        }
      })
      .catch(err => {
        console.error('Camera error:', err);
        setError(err.message || 'Error al acceder a la cámara');
        setLoading(false);
      });
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  return (
    <div className="qr-scanner-container">
      <div className="scanner-header">
        <h2>Prueba Inmediata de Cámara</h2>
        <p>Muestra el video inmediatamente sin esperar</p>
      </div>

      {!scanning && !loading && (
        <div className="scanner-start">
          <div className="camera-icon">
            <Camera size={64} />
          </div>
          <button onClick={startCamera} className="start-button">
            Iniciar Cámara Inmediata
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
          </div>
          <button onClick={stopCamera} className="stop-button">
            <X size={20} />
            Detener Cámara
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
    </div>
  );
};

export default ImmediateCameraTest; 