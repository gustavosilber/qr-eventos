import React from 'react';
import SimpleCameraTest from '../components/SimpleCameraTest';
import '../styles/EscanearEntrada.css';

const SimpleCameraPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Prueba Simple de Cámara</h1>
        <p>Versión simplificada para diagnosticar problemas de cámara</p>
      </div>
      
      <SimpleCameraTest />
    </div>
  );
};

export default SimpleCameraPage; 