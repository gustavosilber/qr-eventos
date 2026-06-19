import React, { useMemo, useState } from 'react';
import '../styles/Pagar.css';
const STATIC_MP_LINK = 'https://mpago.la/1Mukgf3';

const Pagar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState({ label: 'Social', price: 15000 });
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    email: ''
  });

  const eventInfo = useMemo(() => ({
    logo: '/images/merlo-baila-silber-logo.png',
    titulo: 'MERLO BAILA SILBER Edition',
    fecha: '27 de septiembre / 22:00',
    lugar: 'Merlo Mutiespacio · Merlo, San Luis',
    fondo: '/images/merlo-baila-silber-logo.png',
    precios: [
      { label: 'Social', price: '$15.000' },
      { label: 'Social + 1 Taller', price: '$20.000' },
      { label: 'Full Pass', price: '$40.000' }
    ],
    detalles: [
      'Shows en vivo',
      'DJ invitados',
      'Sorteos y sorpresas',
      'Bar y gastronomía'
    ]
  }), []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.apellido || !form.dni || !form.fechaNacimiento || !form.email) {
      alert('Completá todos los campos.');
      return;
    }
    try {
      localStorage.setItem('qrPurchaseLead', JSON.stringify({ ...form, ts: Date.now(), ticket: selected }));
    } catch {}
    // Abrir el link de pago en una pestaña nueva
    try {
      window.open(STATIC_MP_LINK, '_blank', 'noopener');
    } catch {}
    setIsOpen(false);
  };

  return (
    <div className="pagar-page">
      <div className="pagar-hero" style={{ backgroundImage: `url(${eventInfo.fondo})` }}>
        <div className="pagar-hero-overlay" />
        <div className="pagar-hero-content">
          <img src={eventInfo.logo} alt={eventInfo.titulo} className="pagar-logo" />
          <h1 className="pagar-title">{eventInfo.titulo}</h1>
          <p className="pagar-subtitle">{eventInfo.lugar}</p>
        </div>
      </div>

      <div className="pagar-content">
          <div className="pagar-card">
          <div className="pagar-card-header">
            <div className="pagar-date">{eventInfo.fecha}</div>
            <div className="selector-label">Selecciona tu Entrada:</div>
            <div className="pagar-prices">
              {eventInfo.precios.map((p) => (
                <button 
                  key={p.label} 
                  type="button"
                  className={`price-item ${selected.label === p.label ? 'active' : ''}`}
                  onClick={() => setSelected({ label: p.label, price: parseInt(p.price.replace(/[^\d]/g, ''), 10) || 0 })}
                >
                  <span className="price-label">{p.label} {p.price}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="pagar-details">
            <h3>Detalles</h3>
            <ul>
              {eventInfo.detalles.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
          <div className="pagar-cta">
            <div style={{ marginRight: 'auto', fontWeight: 600 }}>Seleccionado: {selected.label} — ${selected.price.toLocaleString('es-AR')}</div>
            <button className="buy-button" onClick={() => setIsOpen(true)}>
              Comprar {selected.label}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Completar datos — {selected.label}</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={onSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre</label>
                  <input name="nombre" value={form.nombre} onChange={onChange} required />
                </div>
                <div className="form-group">
                  <label>Apellido</label>
                  <input name="apellido" value={form.apellido} onChange={onChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>DNI</label>
                  <input name="dni" value={form.dni} onChange={onChange} required />
                </div>
                <div className="form-group">
                  <label>Fecha de nacimiento</label>
                  <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={onChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Email</label>
                  <input type="email" name="email" value={form.email} onChange={onChange} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="confirm-button">Ir a pagar {selected.label}</button>
                <button type="button" className="cancel-button" onClick={() => setIsOpen(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagar;


