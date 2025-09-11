import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader } from 'lucide-react';
import '../styles/QRScanner.css';

const SimpleCameraTest = () => {
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

  const startCamera = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Starting camera...');

      // Configuración más simple
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Stream obtained:', stream);

      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log('Setting video srcObject...');
        videoRef.current.srcObject = stream;
        console.log('Video srcObject set');
        
        // Configurar eventos básicos
        videoRef.current.onloadstart = () => console.log('Video load started');
        videoRef.current.onloadedmetadata = () => console.log('Video metadata loaded');
        videoRef.current.oncanplay = () => console.log('Video can play');
        videoRef.current.onplay = () => console.log('Video play event');
        videoRef.current.onerror = (e) => console.error('Video error:', e);
        
        // Intentar reproducir inmediatamente
        try {
          console.log('Attempting to play video...');
          await videoRef.current.play();
          console.log('Video play() successful');
        } catch (playError) {
          console.error('Error in play():', playError);
          throw playError;
        }
      }

      setScanning(true);
      setLoading(false);

    } catch (err) {
      console.error('Camera error:', err);
      setError(err.message || 'Error al acceder a la cámara');
      setLoading(false);
    }
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
        <h2>Prueba Simple de Cámara</h2>
        <p>Versión simplificada para diagnosticar problemas</p>
      </div>

      {!scanning && !loading && (
        <div className="scanner-start">
          <div className="camera-icon">
            <Camera size={64} />
          </div>
          <button onClick={startCamera} className="start-button">
            Iniciar Cámara Simple
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

export default SimpleCameraTest; 