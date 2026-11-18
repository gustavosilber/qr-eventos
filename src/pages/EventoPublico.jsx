import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar, MapPin, Ticket, CreditCard, CheckCircle2 } from 'lucide-react'
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
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function EventoPublico() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState('select') // select | checkout | done

  const [tierId, setTierId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [form, setForm] = useState({
    buyerName: '',
    buyerSurname: '',
    buyerEmail: '',
    buyerWhatsapp: '',
    buyerDni: '',
  })
  const [checkoutResult, setCheckoutResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/public/events/${slug}`)
        const json = await res.json()
        if (json?.ok) {
          setData(json)
          if (json.tiers?.length === 1) setTierId(json.tiers[0].id)
          if (json.paymentMethods?.length === 1) setPaymentMethodId(json.paymentMethods[0].id)
        } else {
          setError('Evento no encontrado o no publicado.')
        }
      } catch {
        setError('No se pudo cargar el evento.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const selectedTier = useMemo(
    () => data?.tiers?.find((t) => t.id === tierId),
    [data, tierId],
  )

  const visiblePaymentMethods = useMemo(() => {
    if (!data?.paymentMethods) return []
    return data.paymentMethods.filter((m) => {
      if (m.type !== 'mercadopago') return true
      return Boolean(selectedTier?.mpCheckoutUrl)
    })
  }, [data, selectedTier])

  useEffect(() => {
    if (!visiblePaymentMethods.length) {
      setPaymentMethodId('')
      return
    }
    const stillValid = visiblePaymentMethods.some((m) => m.id === paymentMethodId)
    if (!stillValid) {
      setPaymentMethodId(visiblePaymentMethods[0].id)
    }
  }, [tierId, visiblePaymentMethods, paymentMethodId])

  const selectedPayment = useMemo(
    () => visiblePaymentMethods.find((m) => m.id === paymentMethodId),
    [visiblePaymentMethods, paymentMethodId],
  )

  const canCheckout =
    tierId &&
    paymentMethodId &&
    form.buyerName.trim() &&
    form.buyerEmail.trim() &&
    form.buyerWhatsapp.trim()

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canCheckout) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/public/events/${slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId,
          paymentMethodId,
          ...form,
        }),
      })
      const json = await res.json()
      if (json?.ok) {
        setCheckoutResult(json)
        setStep('done')
        if (json.paymentType === 'mercadopago' && json.redirectUrl) {
          window.open(json.redirectUrl, '_blank', 'noopener')
        }
      } else {
        setError(
          json?.error === 'tier_sold_out'
            ? 'Entrada agotada.'
            : json?.error === 'mp_link_not_configured_for_tier'
              ? 'Mercado Pago no está configurado para esta entrada.'
              : json?.error === 'invalid_whatsapp'
                ? 'Ingresá un WhatsApp válido (con código de área).'
                : 'No se pudo procesar la compra.',
        )
      }
    } catch {
      setError('Error de red. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="evento-publico-page">
        <div className="evento-publico-loading">Cargando evento...</div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="evento-publico-page">
        <div className="evento-publico-error">{error}</div>
      </div>
    )
  }

  const { event, tiers, paymentMethods } = data

  const coverStyle = event.coverImage
    ? { backgroundImage: `url(${event.coverImage})` }
    : undefined

  return (
    <div className="evento-publico-page">
      <div className="evento-publico-theme">
        <ThemeToggle />
      </div>

      <div className="evento-publico-shell">
      <main className="evento-publico-main">
        <header className="evento-publico-card evento-publico-hero-card">
          <div
            className={`evento-publico-hero-media${event.coverImage ? '' : ' is-fallback'}`}
            style={coverStyle}
            aria-hidden={!event.coverImage}
          />
          <div className="evento-publico-hero-overlay" />
          <div className="evento-publico-hero-inner">
            <img
              src="/images/ticketfest-logo.png"
              alt="TicketFest"
              className="evento-publico-logo"
              onError={(e) => { e.currentTarget.src = '/images/merlo-baila-silber-logo.png' }}
            />
            <h1>{event.title}</h1>
            <div className="evento-publico-meta">
              <span><Calendar size={16} /> {formatDate(event.date)}</span>
              <span><MapPin size={16} /> {event.location}</span>
            </div>
            {event.description && <p className="evento-publico-desc">{event.description}</p>}
          </div>
        </header>

        {step === 'done' && checkoutResult ? (
          <section className="evento-publico-card checkout-done">
            <div className="done-icon"><CheckCircle2 size={48} /></div>
            <h2>¡Pedido registrado!</h2>
            <p className="muted">
              Referencia: <strong>{checkoutResult.referenceCode}</strong>
            </p>
            <p>
              {checkoutResult.paymentType === 'transfer' && (
                <>
                  Transferí <strong>{formatMoney(checkoutResult.amountCents, checkoutResult.currency)}</strong> e
                  indicá el código <strong>{checkoutResult.referenceCode}</strong> en el concepto.
                </>
              )}
              {checkoutResult.paymentType === 'mercadopago' && (
                <>Completá el pago en Mercado Pago. Guardá tu referencia: <strong>{checkoutResult.referenceCode}</strong>.</>
              )}
              {checkoutResult.paymentType === 'cash' && (
                <>Presentate en boletería con la referencia <strong>{checkoutResult.referenceCode}</strong>.</>
              )}
            </p>

            {checkoutResult.transfer && (
              <div className="payment-instructions">
                <h3>Datos para transferir</h3>
                {checkoutResult.transfer.bankName && <p>Banco: {checkoutResult.transfer.bankName}</p>}
                {checkoutResult.transfer.cbu && <p>CBU: <code>{checkoutResult.transfer.cbu}</code></p>}
                {checkoutResult.transfer.alias && <p>Alias: <code>{checkoutResult.transfer.alias}</code></p>}
                {checkoutResult.transfer.holderName && <p>Titular: {checkoutResult.transfer.holderName}</p>}
                {checkoutResult.transfer.instructions && <p className="muted">{checkoutResult.transfer.instructions}</p>}
              </div>
            )}

            {checkoutResult.cash?.instructions && (
              <div className="payment-instructions">
                <p>{checkoutResult.cash.instructions}</p>
              </div>
            )}

            {checkoutResult.paymentType === 'mercadopago' && checkoutResult.redirectUrl && (
              <a href={checkoutResult.redirectUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Ir a Mercado Pago
              </a>
            )}

            {checkoutResult.ticketUrl && (
              <p className="muted mt-3" style={{ fontSize: '0.85rem' }}>
                Cuando confirmen tu pago, tu entrada QR estará en:{' '}
                <a href={checkoutResult.ticketUrl}>{checkoutResult.ticketUrl}</a>
              </p>
            )}
            <p className="muted mt-2" style={{ fontSize: '0.85rem' }}>
              Te enviaremos la entrada por WhatsApp y email al confirmar el pago.
            </p>
          </section>
        ) : (
          <form className="evento-publico-card" onSubmit={onSubmit}>
            <section className="checkout-section">
              <h2><Ticket size={20} /> Elegí tu entrada</h2>
              {tiers.length === 0 ? (
                <p className="empty">No hay entradas disponibles en este momento.</p>
              ) : (
                <div className="tier-grid">
                  {tiers.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`tier-option${tierId === t.id ? ' active' : ''}`}
                      onClick={() => setTierId(t.id)}
                    >
                      <span className="tier-name">{t.name}</span>
                      <span className="tier-price">{formatMoney(t.priceCents, t.currency)}</span>
                      {t.remaining != null && (
                        <span className="tier-remaining">{t.remaining} disponibles</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {tiers.length > 0 && (
              <>
                <section className="checkout-section">
                  <h2>Tus datos</h2>
                  <div className="form-row">
                    <label>
                      Nombre *
                      <input required value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} />
                    </label>
                    <label>
                      Apellido
                      <input value={form.buyerSurname} onChange={(e) => setForm({ ...form, buyerSurname: e.target.value })} />
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      Email *
                      <input type="email" required value={form.buyerEmail} onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })} />
                    </label>
                    <label>
                      WhatsApp *
                      <input
                        type="tel"
                        required
                        inputMode="tel"
                        placeholder="11 2345 6789"
                        value={form.buyerWhatsapp}
                        onChange={(e) => setForm({ ...form, buyerWhatsapp: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      DNI
                      <input value={form.buyerDni} onChange={(e) => setForm({ ...form, buyerDni: e.target.value })} />
                    </label>
                  </div>
                </section>

                <section className="checkout-section">
                  <h2><CreditCard size={20} /> Forma de pago</h2>
                  {visiblePaymentMethods.length === 0 ? (
                    <p className="empty">
                      {tierId && selectedTier && !selectedTier.mpCheckoutUrl
                        ? 'Para esta entrada no hay métodos de pago disponibles. Elegí otra entrada o contactá al organizador.'
                        : 'El organizador aún no configuró métodos de pago.'}
                    </p>
                  ) : (
                    <div className="payment-grid">
                      {visiblePaymentMethods.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className={`payment-option${paymentMethodId === m.id ? ' active' : ''}`}
                          onClick={() => setPaymentMethodId(m.id)}
                        >
                          <strong>{m.label}</strong>
                          <span className="muted">
                            {m.type === 'transfer' && 'Transferencia'}
                            {m.type === 'mercadopago' && 'Mercado Pago'}
                            {m.type === 'cash' && 'Efectivo'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                {error && <p className="checkout-error">{error}</p>}

                <div className="checkout-footer">
                  {selectedTier && (
                    <div className="checkout-total">
                      Total: <strong>{formatMoney(selectedTier.priceCents, selectedTier.currency)}</strong>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary btn-large"
                    disabled={!canCheckout || submitting || visiblePaymentMethods.length === 0}
                  >
                    {submitting ? 'Procesando...' : 'Continuar compra'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </main>
      </div>

      <footer className="evento-publico-footer">
        Powered by <strong>TicketFest</strong>
      </footer>
    </div>
  )
}
