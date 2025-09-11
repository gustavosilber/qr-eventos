import React from 'react';
import TestCamera from '../components/TestCamera';
import '../styles/EscanearEntrada.css';

const TestCameraPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Prueba de Cámara</h1>
        <p>Verificando que la cámara funcione correctamente</p>
      </div>
      
      <TestCamera />
    </div>
  );
};

export default TestCameraPage; 