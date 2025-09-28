import React, { useState, useEffect } from 'react';
import { CheckCircle, Users, RefreshCw, Smile } from 'lucide-react';
import { 
  attendeesList, 
  attendeesDetails,
  getVerificationStatus, 
  markAttendeeAsVerified
} from '../data/attendees';
import '../styles/AttendeesTable.css';

const AttendeesTable = () => {
  const [verificationStatus, setVerificationStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'status'

  useEffect(() => {
    // Cargar el estado de verificación desde localStorage
    const status = getVerificationStatus();
    setVerificationStatus(status);
  }, []);

  // Función para marcar un asistente como verificado manualmente
  const handleManualVerification = (attendeeName) => {
    const newStatus = markAttendeeAsVerified(attendeeName);
    setVerificationStatus(newStatus);
  };

  // Función para limpiar todas las verificaciones
  const clearAllVerifications = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar todas las verificaciones?')) {
      localStorage.removeItem('qrVerificationStatus');
      setVerificationStatus({});
    }
  };

  // Filtrar y ordenar la lista (sin deduplicar, mantener todas las filas)
  const filteredAndSortedAttendees = attendeesList
    .filter(attendee => 
      attendee.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'status') {
        const aVerified = verificationStatus[a]?.verified || false;
        const bVerified = verificationStatus[b]?.verified || false;
        if (aVerified === bVerified) {
          return a.localeCompare(b);
        }
        return aVerified ? -1 : 1;
      }
      return a.localeCompare(b);
    });

  const verifiedCount = Object.values(verificationStatus).filter(status => status.socialVerified || status.verified).length;
  const totalCount = attendeesDetails.length;

  return (
    <div className="attendees-table-container">
      <div className="table-header">
        <div className="header-info">
          <Users size={24} />
          <h2>Lista de Asistentes</h2>
          <div className="stats">
            <span className="verified-count">{verifiedCount}</span>
            <span className="separator">/</span>
            <span className="total-count">{totalCount}</span>
            <span className="verified-label">verificados</span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={clearAllVerifications} 
            className="clear-button"
            title="Limpiar todas las verificaciones"
          >
            <RefreshCw size={16} />
            Limpiar
          </button>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar asistente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="sort-container">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Ordenar por nombre</option>
            <option value="status">Ordenar por estado</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="attendees-table">
          <thead>
            <tr>
              <th className="status-header">Estado</th>
              <th className="name-header">Nombre</th>
              <th className="time-header">Verificado el</th>
              <th className="action-header">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedAttendees.map((attendee, idx) => {
              const v = verificationStatus[attendee] || {};
              const isVerified = v.socialVerified || v.verified || false;
              const verifiedAt = v.socialVerifiedAt || v.verifiedAt || '';
              
              return (
                <tr 
                  key={`${attendee}-${idx}`} 
                  className={`attendee-row ${isVerified ? 'verified' : 'not-verified'}`}
                >
                  <td className="status-cell">
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {v.workshopsVerified && <span className="status-badge verified">Talleres ✓</span>}
                      {v.socialVerified && <span className="status-badge verified">Social ✓</span>}
                      {!v.workshopsVerified && !v.socialVerified && <div className="not-verified-icon">○</div>}
                    </div>
                  </td>
                  
                  <td className="name-cell">
                    {attendee}
                    {isVerified && (
                      <Smile size={16} className="verified-smile" />
                    )}
                  </td>
                  
                  <td className="time-cell">
                    {isVerified ? verifiedAt : '-'}
                  </td>
                  
                  <td className="action-cell">
                    {!isVerified && (
                      <button
                        onClick={() => handleManualVerification(attendee)}
                        className="verify-button"
                        title="Marcar como verificado"
                      >
                        Verificar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredAndSortedAttendees.length === 0 && (
        <div className="no-results">
          <p>No se encontraron asistentes que coincidan con "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default AttendeesTable; 