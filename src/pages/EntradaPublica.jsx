import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { Calendar, MapPin, Ticket } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'
import '../styles/EventoPublico.css'

function formatMoney(cents, currency = 'ARS') {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(cents) / 100)
  } catch {
    return `${currency} ${(Number(cents) / 100).toFixed(0)}`
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function EntradaPublica() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/public/tickets/${encodeURIComponent(token)}`)
        const json = await res.json()
        if (json?.ok) setData(json)
        else setError('Entrada no encontrada.')
      } catch {
        setError('No se pudo cargar la entrada.')
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
  }, [token])

  return (
    <div className="evento-publico">
      <header className="evento-publico-top">
        <img src="/images/ticketfest-logo.png" alt="TicketFest" className="evento-publico-logo" />
        <ThemeToggle />
      </header>

      <main className="evento-publico-main">
        {loading && <p className="empty">Cargando tu entrada...</p>}
        {error && <p className="empty">{error}</p>}

        {!loading && data?.pending && (
          <section className="evento-publico-card checkout-done">
            <Ticket size={40} />
            <h1>Pago pendiente</h1>
            <p>{data.message}</p>
            <p className="muted">
              Evento: <strong>{data.eventTitle}</strong>
              <br />
              Entrada: {data.tierName}
              <br />
              Ref: <code>{data.referenceCode}</code>
            </p>
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Guardá este link. Cuando el organizador confirme el pago, tu QR va a aparecer acá.
            </p>
          </section>
        )}

        {!loading && data && !data.pending && data.qrData && (
          <section className="evento-publico-card ticket-public-card">
            <p className="muted" style={{ textAlign: 'center', marginBottom: 4 }}>Tu entrada</p>
            <h1 style={{ textAlign: 'center', margin: '0 0 0.5rem', fontSize: '1.4rem' }}>
              {data.eventTitle}
            </h1>
            <div className="ticket-public-meta">
              {data.eventDate && (
                <span><Calendar size={14} /> {formatDate(data.eventDate)}</span>
              )}
              {data.eventLocation && (
                <span><MapPin size={14} /> {data.eventLocation}</span>
              )}
            </div>

            <div className="ticket-public-qr">
              <QRCodeCanvas value={data.qrData} size={240} includeMargin />
            </div>

            <div className="ticket-public-details">
              <strong>
                {data.buyerName} {data.buyerSurname || ''}
              </strong>
              <span>{data.tierName}</span>
              <span>{formatMoney(data.amountCents, data.currency)}</span>
              <span className="muted">Ref. {data.referenceCode}</span>
            </div>

            <p className="muted" style={{ textAlign: 'center', fontSize: '0.82rem', marginTop: '1rem' }}>
              Mostrá este QR en la puerta del evento. No lo compartas.
            </p>
          </section>
        )}
      </main>

      <footer className="evento-publico-footer">
        Powered by <strong>TicketFest</strong>
      </footer>
    </div>
  )
}
