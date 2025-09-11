import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader } from 'lucide-react';
import '../styles/QRScanner.css';

const BasicCameraTest = () => {
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
          console.log('Video element found, setting srcObject...');
          videoRef.current.srcObject = stream;
          console.log('Video srcObject set successfully');
          
          // Verificar que el video element existe
          console.log('Video element properties:', {
            readyState: videoRef.current.readyState,
            networkState: videoRef.current.networkState,
            srcObject: videoRef.current.srcObject
          });
          
          // Configurar eventos
          videoRef.current.onloadstart = () => console.log('Video load started');
          videoRef.current.onloadedmetadata = () => console.log('Video metadata loaded');
          videoRef.current.oncanplay = () => console.log('Video can play');
          videoRef.current.onplay = () => console.log('Video play event');
          videoRef.current.onerror = (e) => console.error('Video error:', e);
          
          // Intentar reproducir con timeout
          console.log('Attempting to play video...');
          
          const playPromise = videoRef.current.play();
          
          // Timeout de 5 segundos
          const timeout = setTimeout(() => {
            console.warn('Play timeout - forcing state change');
            setScanning(true);
            setLoading(false);
          }, 5000);
          
          playPromise
            .then(() => {
              console.log('Video play() successful');
              clearTimeout(timeout);
              setScanning(true);
              setLoading(false);
            })
            .catch(playError => {
              console.error('Error in play():', playError);
              clearTimeout(timeout);
              setError('Error al reproducir video: ' + playError.message);
              setLoading(false);
            });
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
        <h2>Prueba Básica de Cámara</h2>
        <p>Versión más simple sin async/await</p>
      </div>

      {!scanning && !loading && (
        <div className="scanner-start">
          <div className="camera-icon">
            <Camera size={64} />
          </div>
          <button onClick={startCamera} className="start-button">
            Iniciar Cámara Básica
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

export default BasicCameraTest; 