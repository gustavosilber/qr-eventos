import React, { useEffect, useState } from 'react';
import {
  addDynamicAttendee,
  clearDynamicAttendees,
  importAttendeesText,
  getCombinedAttendeesDetails,
  subscribeAttendeesUpdates
} from '../data/attendees';

const AttendeesManager = () => {
  const [nombre, setNombre] = useState('');
  const [abonado, setAbonado] = useState('');
  const [tipoEntrada, setTipoEntrada] = useState('Social');
  const [fileStatus, setFileStatus] = useState('');
  const [total, setTotal] = useState(getCombinedAttendeesDetails().length);

  useEffect(() => {
    const unsub = subscribeAttendeesUpdates(() => setTotal(getCombinedAttendeesDetails().length));
    return unsub;
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    const ok = addDynamicAttendee({ nombre, abonado, tipoEntrada });
    if (ok) {
      setNombre('');
      setAbonado('');
      setTipoEntrada('Social');
    }
  };

  const handleClear = () => {
    if (window.confirm('¿Eliminar asistentes agregados dinámicamente?')) {
      clearDynamicAttendees();
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = importAttendeesText(text);
      setFileStatus(`Importados: ${res.imported}`);
      e.target.value = '';
    } catch (err) {
      console.error(err);
      setFileStatus('Error al leer archivo');
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <h3>Administrar asistentes</h3>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input placeholder="Abonado" value={abonado} onChange={(e) => setAbonado(e.target.value)} />
        <select value={tipoEntrada} onChange={(e) => setTipoEntrada(e.target.value)}>
          <option value="Social">Social</option>
          <option value="1 Taller">1 Taller</option>
          <option value="2 Talleres">2 Talleres</option>
          <option value="Full Pass">Full Pass</option>
          <option value="PROFE">PROFE</option>
        </select>
        <button type="submit">Agregar</button>
        <button type="button" onClick={handleClear}>Limpiar dinámicos</button>
      </form>

      <div style={{ marginTop: 8 }}>
        <input type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values,.txt" onChange={handleFile} />
        {fileStatus && <div style={{ marginTop: 6 }}>{fileStatus}</div>}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
        Total combinados: {total}
      </div>
    </div>
  );
};

export default AttendeesManager;

