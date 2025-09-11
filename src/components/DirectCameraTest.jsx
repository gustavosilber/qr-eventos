import React, { useState, useEffect } from 'react';
import { Camera, X, Loader } from 'lucide-react';
import '../styles/QRScanner.css';

const DirectCameraTest = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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
        console.log('Stream tracks:', stream.getTracks());
        console.log('Stream active:', stream.active);
        setStream(stream);
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
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  return (
    <div className="qr-scanner-container">
      <div className="scanner-header">
        <h2>Prueba Directa de Cámara</h2>
        <p>Usando estado directo sin refs</p>
      </div>

      {!scanning && !loading && (
        <div className="scanner-start">
          <div className="camera-icon">
            <Camera size={64} />
          </div>
          <button onClick={startCamera} className="start-button">
            Iniciar Cámara Directa
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

      {scanning && stream && (
        <div className="scanner-active">
          <div className="video-container">
            <video
              ref={(video) => {
                if (video && stream) {
                  video.srcObject = stream;
                  video.play().catch(e => console.warn('Auto-play failed:', e));
                }
              }}
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
            <div className="qr-overlay">
              <div className="qr-frame"></div>
            </div>
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

export default DirectCameraTest; 