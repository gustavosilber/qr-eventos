import React from 'react';
import AttendeesTable from '../components/AttendeesTable';
import '../styles/ListaAsistentes.css';

const ListaAsistentes = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Lista de Asistentes</h1>
        <p>Gestiona y verifica la asistencia de los invitados al evento</p>
      </div>
      
      <AttendeesTable />
    </div>
  );
};

export default ListaAsistentes; 