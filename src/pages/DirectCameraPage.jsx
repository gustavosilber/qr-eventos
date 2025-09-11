import React from 'react';
import DirectCameraTest from '../components/DirectCameraTest';
import '../styles/EscanearEntrada.css';

const DirectCameraPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Prueba Directa de Cámara</h1>
        <p>Usando estado directo sin refs para evitar problemas de DOM</p>
      </div>
      
      <DirectCameraTest />
    </div>
  );
};

export default DirectCameraPage; 