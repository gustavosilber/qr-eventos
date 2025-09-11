import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import '../styles/QRScanner.css';

const TestCamera = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraMode, setCameraMode] = useState('user'); // 'user' = frontal, 'environment' = trasera
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

      // Verificar soporte del navegador
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara');
      }

      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraMode, // Usar el modo seleccionado
          width: { ideal: 640, min: 320, max: 1920 },
          height: { ideal: 480, min: 240, max: 1080 },
          frameRate: { ideal: 30, min: 10, max: 60 }
        }
      });

      console.log('Camera stream obtained:', stream);

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
        };
        
        videoRef.current.oncanplay = () => {
          console.log('Video can play');
        };
        
        videoRef.current.onplay = () => {
          console.log('Video is playing');
        };
        
        videoRef.current.onloadeddata = () => {
          console.log('Video data loaded');
        };
        
        videoRef.current.oncanplaythrough = () => {
          console.log('Video can play through');
        };
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        };
        
        videoRef.current.onloadeddata = () => {
          console.log('Video data loaded, ready state:', videoRef.current.readyState);
        };
        
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
        };

        try {
          await videoRef.current.play();
          console.log('Video started successfully');
          
          // Verificar que el video esté realmente reproduciéndose
          setTimeout(() => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              console.log('Video is ready and playing');
            } else {
              console.warn('Video might not be playing properly');
            }
          }, 1000);
          
        } catch (playError) {
          console.error('Error playing video:', playError);
          throw new Error('No se pudo reproducir el video de la cámara');
        }
      }

      setScanning(true);
      setLoading(false);

    } catch (err) {
      console.error('Error starting camera:', err);
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

  const switchCamera = async () => {
    if (scanning) {
      stopCamera();
      setCameraMode(cameraMode === 'user' ? 'environment' : 'user');
      setTimeout(() => {
        startCamera();
      }, 500);
    }
  };

  return (
    <div className="qr-scanner-container">
      <div className="scanner-header">
        <h2>Prueba de Cámara</h2>
        <p>Verificando que la cámara funcione correctamente</p>
      </div>

      {!scanning && !loading && (
        <div className="scanner-start">
          <div className="camera-icon">
            <Camera size={64} />
          </div>
          <button onClick={startCamera} className="start-button">
            Probar Cámara
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
            <div className="qr-overlay">
              <div className="qr-frame"></div>
            </div>
          </div>
          <div className="camera-controls">
            <button onClick={switchCamera} className="switch-button">
              <Camera size={20} />
              Cambiar Cámara ({cameraMode === 'user' ? 'Frontal' : 'Trasera'})
            </button>
            <button onClick={stopCamera} className="stop-button">
              <X size={20} />
              Detener Cámara
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

export default TestCamera; 