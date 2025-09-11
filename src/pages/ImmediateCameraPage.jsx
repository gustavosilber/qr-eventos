import React from 'react';
import ImmediateCameraTest from '../components/ImmediateCameraTest';
import '../styles/EscanearEntrada.css';

const ImmediateCameraPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Prueba Inmediata de Cámara</h1>
        <p>Muestra el video inmediatamente sin esperar a que se reproduzca</p>
      </div>
      
      <ImmediateCameraTest />
    </div>
  );
};

export default ImmediateCameraPage; 