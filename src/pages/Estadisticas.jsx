import React, { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  DollarSign,
  Ticket,
  Gift,
  UserCheck,
  Lightbulb,
  TrendingUp,
  ShoppingCart,
  Clock,
  CreditCard,
  Store,
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import '../styles/MiEvento.css'
import '../styles/Estadisticas.css'

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
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function paymentLabel(method) {
  if (method === 'mercadopago') return 'Mercado Pago'
  if (method === 'transfer') return 'Transferencia'
  if (method === 'cash') return 'Efectivo'
  return method
}

function orderStatusLabel(status) {
  if (status === 'paid') return 'Pagado'
  if (status === 'pending_payment') return 'Pendiente'
  if (status === 'cancelled') return 'Cancelado'
  return status
}

function buildInsights(data) {
  if (!data?.summary) return []
  const insights = []
  const {
    summary,
    salesByTier,
    salesByDate,
    freePassesByNote,
    onlineSalesByDate,
    onlineSalesByTier,
    onlineByPayment,
  } = data
  const online = summary.online || {}

  const combined = summary.combinedRevenueByCurrency || []
  if (combined.length > 0) {
    const total = combined.reduce((s, r) => s + r.revenueCents, 0)
    const onlinePart = combined.reduce((s, r) => s + r.onlineRevenueCents, 0)
    if (onlinePart > 0) {
      insights.push({
        icon: Store,
        text: `El ${Math.round((onlinePart / total) * 100) || 0}% de tus ingresos (${formatMoney(onlinePart)}) proviene de ventas online.`,
      })
    }
  }

  if (online.pendingOrders > 0) {
    insights.push({
      icon: Clock,
      text: `Tenés ${online.pendingOrders} orden${online.pendingOrders !== 1 ? 'es' : ''} online pendiente${online.pendingOrders !== 1 ? 's' : ''} de confirmar. Revisalas en Editar evento → Venta pública.`,
    })
  }

  if (online.totalOrders > 0 && online.conversionRate < 0.5) {
    insights.push({
      icon: ShoppingCart,
      text: `Solo el ${Math.round(online.conversionRate * 100)}% de las órdenes online se confirmaron como pagadas. Seguí up las transferencias pendientes.`,
    })
  } else if (online.paidOrders > 0 && online.conversionRate >= 0.8) {
    insights.push({
      icon: ShoppingCart,
      text: `Buena tasa de cierre online: ${Math.round(online.conversionRate * 100)}% de órdenes confirmadas.`,
    })
  }

  const topOnlineDay = [...(onlineSalesByDate || [])].sort((a, b) => b.paidCount - a.paidCount)[0]
  if (topOnlineDay?.paidCount > 0) {
    insights.push({
      icon: TrendingUp,
      text: `Mejor día de ventas online: ${formatDate(topOnlineDay.date)} con ${topOnlineDay.paidCount} entrada${topOnlineDay.paidCount !== 1 ? 's' : ''} confirmada${topOnlineDay.paidCount !== 1 ? 's' : ''}.`,
    })
  }

  const topOnlineTier = [...(onlineSalesByTier || [])].sort((a, b) => b.paidCount - a.paidCount)[0]
  if (topOnlineTier?.paidCount > 0) {
    insights.push({
      icon: Ticket,
      text: `La entrada más vendida online es "${topOnlineTier.tierName}" (${topOnlineTier.paidCount} confirmadas, ${formatMoney(topOnlineTier.revenueCents, topOnlineTier.currency)}).`,
    })
  }

  const topOnlinePayment = [...(onlineByPayment || [])].sort((a, b) => b.paid - a.paid)[0]
  if (topOnlinePayment?.paid > 0) {
    insights.push({
      icon: CreditCard,
      text: `Método de pago online más usado: ${paymentLabel(topOnlinePayment.method)} (${topOnlinePayment.paid} ventas confirmadas).`,
    })
  }

  if (summary.revenueByCurrency.length > 0) {
    const top = [...salesByDate].sort((a, b) => b.count - a.count)[0]
    if (top) {
      insights.push({
        icon: TrendingUp,
        text: `Mejor día de emisiones manuales: ${formatDate(top.date)} con ${top.count} entrada${top.count !== 1 ? 's' : ''}.`,
      })
    }
  }

  const topTier = [...(salesByTier || [])].sort((a, b) => b.issuedCount - a.issuedCount)[0]
  if (topTier?.issuedCount > 0) {
    insights.push({
      icon: Ticket,
      text: `Tarifa más emitida manualmente: "${topTier.tierName}" (${topTier.issuedCount} entradas).`,
    })
  }

  for (const tier of salesByTier || []) {
    const cap = tier.quantity || 0
    if (cap > 0 && tier.issuedCount / cap >= 0.8) {
      insights.push({
        icon: BarChart3,
        text: `"${tier.tierName}" está al ${Math.round((tier.issuedCount / cap) * 100)}% de capacidad — considerá abrir una tarifa adicional.`,
      })
    }
  }

  if (summary.freePasses?.available > 0) {
    insights.push({
      icon: Gift,
      text: `Tenés ${summary.freePasses.available} Free Pass sin asignar. Asignalos antes del evento.`,
    })
  }

  if (summary.totalAttendees > 0 && summary.checkInRate < 0.5) {
    insights.push({
      icon: UserCheck,
      text: `Solo el ${Math.round(summary.checkInRate * 100)}% de asistentes fue verificado en puerta.`,
    })
  } else if (summary.totalAttendees > 0 && summary.checkInRate >= 0.8) {
    insights.push({
      icon: UserCheck,
      text: `Excelente check-in: ${Math.round(summary.checkInRate * 100)}% de asistentes verificados.`,
    })
  }

  const idleNote = (freePassesByNote || []).find((n) => n.total - n.assigned > 3)
  if (idleNote) {
    insights.push({
      icon: Gift,
      text: `Del tipo "${idleNote.note}" quedan ${idleNote.total - idleNote.assigned} Free Pass sin asignar.`,
    })
  }

  if (online.totalOrders === 0 && summary.store?.publishedEvents === 0) {
    insights.push({
      icon: Store,
      text: 'Publicá tu tienda online (Editar evento → Venta pública) para empezar a vender entradas por link.',
    })
  }

  if (insights.length === 0) {
    insights.push({
      icon: Lightbulb,
      text: 'Emití entradas, publicá tu tienda online o asigná Free Pass para ver métricas aquí.',
    })
  }

  return insights.slice(0, 8)
}

export default function Estadisticas() {
  const { user, authFetch } = useAuth()
  const [eventId, setEventId] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      setError('')
      try {
        const qs = eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''
        const res = await authFetch(`/api/stats${qs}`)
        const json = await res.json()
        if (json?.ok) {
          setData(json)
        } else {
          setError('No se pudieron cargar las estadísticas.')
        }
      } catch (err) {
        if (err?.message === 'token_expired') return
        setError('Error de red al cargar estadísticas.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authFetch, eventId])

  const insights = useMemo(() => buildInsights(data), [data])

  const maxDateCount = useMemo(() => {
    if (!data?.salesByDate?.length) return 1
    return Math.max(...data.salesByDate.map((d) => d.count), 1)
  }, [data])

  const maxOnlineDateCount = useMemo(() => {
    if (!data?.onlineSalesByDate?.length) return 1
    return Math.max(...data.onlineSalesByDate.map((d) => d.paidCount + d.pendingCount), 1)
  }, [data])

  const maxTierCount = useMemo(() => {
    if (!data?.salesByTier?.length) return 1
    return Math.max(...data.salesByTier.map((t) => t.issuedCount), 1)
  }, [data])

  const maxOnlineTierCount = useMemo(() => {
    if (!data?.onlineSalesByTier?.length) return 1
    return Math.max(...data.onlineSalesByTier.map((t) => t.paidCount + t.pendingCount), 1)
  }, [data])

  const combinedRevenue = data?.summary?.combinedRevenueByCurrency || []
  const online = data?.summary?.online || {}

  return (
    <div className="mi-evento-page stats-page">
      <div className="page-title-block">
        <div className="badge-gradient">Métricas</div>
        <h1 style={{ marginTop: '0.5rem' }}>Estadísticas</h1>
        <p>Ventas online, emisiones manuales, Free Pass e ingresos consolidados.</p>
      </div>

      <div className="stats-toolbar">
        <label className="stats-filter">
          <span className="muted" style={{ display: 'block', marginBottom: 4, fontSize: '0.78rem' }}>
            Filtrar por evento
          </span>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">Todos los eventos</option>
            {(data?.events || []).map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.date})
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && (
        <div className="empty">
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
          Cargando métricas...
        </div>
      )}
      {error && <p className="empty">{error}</p>}

      {!loading && data && (
        <>
          <h2 className="stats-section-title">Resumen general</h2>
          <div className="stats-row">
            <div className="stat-card pink">
              <DollarSign className="stat-icon" />
              <div className="stat-label">Ingresos totales</div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                {combinedRevenue.length === 0 ? (
                  '—'
                ) : (
                  <div className="revenue-multi">
                    {combinedRevenue.map((r) => (
                      <span key={r.currency}>{formatMoney(r.revenueCents, r.currency)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="stat-card purple">
              <ShoppingCart className="stat-icon" />
              <div className="stat-label">Ventas online</div>
              <div className="stat-value">{online.paidOrders || 0}</div>
              <div className="stat-sub">{online.pendingOrders || 0} pendientes</div>
            </div>
            <div className="stat-card green">
              <Ticket className="stat-icon" />
              <div className="stat-label">Emitidas manual</div>
              <div className="stat-value">{data.summary.issuedTickets}</div>
            </div>
            <div className="stat-card blue">
              <UserCheck className="stat-icon" />
              <div className="stat-label">Check-in</div>
              <div className="stat-value">
                {data.summary.totalAttendees > 0
                  ? `${Math.round(data.summary.checkInRate * 100)}%`
                  : '—'}
              </div>
            </div>
          </div>

          <h2 className="stats-section-title">
            <Store size={20} /> Ventas online
          </h2>
          <div className="stats-row stats-row-3">
            <div className="stat-card pink">
              <div className="stat-label">Órdenes totales</div>
              <div className="stat-value">{online.totalOrders || 0}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Confirmadas</div>
              <div className="stat-value">{online.paidOrders || 0}</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-label">Ingresos online</div>
              <div className="stat-value" style={{ fontSize: '1.15rem' }}>
                {(online.revenueByCurrency || []).length === 0 ? (
                  '—'
                ) : (
                  <div className="revenue-multi">
                    {(online.revenueByCurrency || []).map((r) => (
                      <span key={r.currency}>{formatMoney(r.revenueCents, r.currency)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="stats-grid-2">
            <section className="mi-evento-list-section chart-card">
              <h3>Ventas online por fecha</h3>
              {(!data.onlineSalesByDate || data.onlineSalesByDate.length === 0) ? (
                <p className="empty">Sin ventas online registradas.</p>
              ) : (
                <div className="bar-chart">
                  {data.onlineSalesByDate.slice(0, 14).map((row) => (
                    <div key={`${row.date}-${row.currency}`} className="bar-row">
                      <span className="bar-label">{formatDate(row.date)}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill green"
                          style={{
                            width: `${((row.paidCount + row.pendingCount) / maxOnlineDateCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="bar-value">
                        {row.paidCount}✓ {row.pendingCount > 0 ? `· ${row.pendingCount}⏳` : ''}
                        {' · '}
                        {formatMoney(row.revenueCents, row.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mi-evento-list-section chart-card">
              <h3>Online por tipo de entrada</h3>
              {(!data.onlineSalesByTier || data.onlineSalesByTier.length === 0) ? (
                <p className="empty">Sin ventas online por tarifa.</p>
              ) : (
                <div className="tier-breakdown">
                  {data.onlineSalesByTier.map((tier) => (
                    <div key={tier.tierId} className="tier-row">
                      <div className="tier-row-main">
                        <strong>{tier.tierName}</strong>
                        <span>
                          {tier.paidCount} confirmadas
                          {tier.pendingCount > 0 ? ` · ${tier.pendingCount} pendientes` : ''}
                        </span>
                        <div className="bar-track" style={{ marginTop: 8 }}>
                          <div
                            className="bar-fill green"
                            style={{
                              width: `${Math.min(100, ((tier.paidCount + tier.pendingCount) / maxOnlineTierCount) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="tier-row-stats">
                        <strong>{formatMoney(tier.revenueCents, tier.currency)}</strong>
                        <span>ingresos</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {data.onlineByPayment?.length > 0 && (
            <section className="mi-evento-list-section chart-card" style={{ marginBottom: '1.25rem' }}>
              <h3>Por método de pago (online)</h3>
              <div className="payment-stats-grid">
                {data.onlineByPayment.map((p) => (
                  <div key={p.method} className="payment-stat-card">
                    <strong>{paymentLabel(p.method)}</strong>
                    <span>{p.paid} pagadas · {p.pending} pendientes</span>
                    <span className="payment-stat-amount">{formatMoney(p.revenueCents)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.recentOnlineOrders?.length > 0 && (
            <section className="mi-evento-list-section chart-card" style={{ marginBottom: '1.25rem' }}>
              <h3>Últimas órdenes online</h3>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      {!eventId && <th>Evento</th>}
                      <th>Ref.</th>
                      <th>Comprador</th>
                      <th>Entrada</th>
                      <th>Pago</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOnlineOrders.map((o) => (
                      <tr key={o.id}>
                        {!eventId && <td>{o.eventTitle}</td>}
                        <td><code>{o.referenceCode}</code></td>
                        <td>{o.buyerName} {o.buyerSurname}</td>
                        <td>{o.tierName}</td>
                        <td>{paymentLabel(o.paymentMethodType)}</td>
                        <td>{formatMoney(o.amountCents, o.currency)}</td>
                        <td>
                          <span className={`badge ${o.status === 'paid' ? 'assigned' : 'available'}`}>
                            {orderStatusLabel(o.status)}
                          </span>
                        </td>
                        <td className="muted">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <h2 className="stats-section-title">Emisiones y Free Pass</h2>
          <div className="stats-grid-2">
            <section className="mi-evento-list-section chart-card">
              <h3>Emisiones manuales por fecha</h3>
              {data.salesByDate.length === 0 ? (
                <p className="empty">Sin emisiones manuales registradas.</p>
              ) : (
                <div className="bar-chart">
                  {data.salesByDate.slice(0, 14).map((row) => (
                    <div key={`${row.date}-${row.currency}`} className="bar-row">
                      <span className="bar-label">{formatDate(row.date)}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${(row.count / maxDateCount) * 100}%` }}
                        />
                      </div>
                      <span className="bar-value">
                        {row.count} · {formatMoney(row.revenueCents, row.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mi-evento-list-section chart-card">
              <h3>Emisiones por tarifa</h3>
              {data.salesByTier.length === 0 ? (
                <p className="empty">No hay tarifas configuradas.</p>
              ) : (
                <div className="tier-breakdown">
                  {data.salesByTier.map((tier) => (
                    <div key={tier.tierId} className="tier-row">
                      <div className="tier-row-main">
                        <strong>{tier.tierName}</strong>
                        <span>
                          {formatMoney(tier.priceCents, tier.currency)} · cupo {tier.quantity || '∞'}
                        </span>
                        <div className="bar-track" style={{ marginTop: 8 }}>
                          <div
                            className="bar-fill purple"
                            style={{
                              width: `${Math.min(100, (tier.issuedCount / maxTierCount) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="tier-row-stats">
                        <strong>{tier.issuedCount}</strong>
                        <span>emitidas</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="mi-evento-list-section chart-card" style={{ marginBottom: '1.25rem' }}>
            <h3>Free Pass</h3>
            <div className="free-pass-grid">
              <div className="fp-mini">
                <div className="num">{data.summary.freePasses.total}</div>
                <div className="lbl">Generados</div>
              </div>
              <div className="fp-mini">
                <div className="num">{data.summary.freePasses.assigned}</div>
                <div className="lbl">Asignados</div>
              </div>
              <div className="fp-mini">
                <div className="num">{data.summary.freePasses.available}</div>
                <div className="lbl">Disponibles</div>
              </div>
              <div className="fp-mini">
                <div className="num">{data.summary.freePasses.redeemed}</div>
                <div className="lbl">Canjeados</div>
              </div>
            </div>
            {data.freePassesByNote.length > 0 && (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Motivo / tipo</th>
                      <th>Total</th>
                      <th>Asignados</th>
                      <th>Canjeados</th>
                      <th>Disponibles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.freePassesByNote.map((row) => (
                      <tr key={row.note}>
                        <td><strong>{row.note}</strong></td>
                        <td>{row.total}</td>
                        <td>{row.assigned}</td>
                        <td>{row.redeemed}</td>
                        <td>{row.total - row.assigned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mi-evento-list-section chart-card">
            <h3>Sugerencias e insights</h3>
            <ul className="insights-list">
              {insights.map((item, i) => (
                <li key={i} className="insight-item">
                  <span className="insight-icon">
                    <item.icon size={14} />
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
