import React from 'react';
import WorkingCameraTest from '../components/WorkingCameraTest';
import '../styles/EscanearEntrada.css';

const EscanearEntrada = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Escanear Entrada</h1>
        <p>Valida las entradas de los asistentes escaneando sus códigos QR</p>
      </div>
      
      <WorkingCameraTest />
    </div>
  );
};

export default EscanearEntrada; 