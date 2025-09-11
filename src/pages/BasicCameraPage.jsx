import React from 'react';
import BasicCameraTest from '../components/BasicCameraTest';
import '../styles/EscanearEntrada.css';

const BasicCameraPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Prueba Básica de Cámara</h1>
        <p>Versión más simple sin async/await para diagnosticar problemas</p>
      </div>
      
      <BasicCameraTest />
    </div>
  );
};

export default BasicCameraPage; 