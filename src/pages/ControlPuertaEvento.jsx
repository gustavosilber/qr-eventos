import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Camera, CheckCircle, XCircle, Loader, AlertTriangle, ScanLine } from 'lucide-react'
import jsQR from 'jsqr'
import { useAuth } from '../auth/AuthProvider'
import '../styles/MiEvento.css'
import '../styles/ControlPuerta.css'

function sourceLabel(source) {
  if (source === 'purchase') return 'Compra online'
  if (source === 'issued') return 'Emitida'
  if (source === 'free_pass') return 'Free Pass'
  return source || '—'
}

export default function ControlPuertaEvento() {
  const { id } = useParams()
  const { user, authFetch } = useAuth()
  const [eventInfo, setEventInfo] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [scanAttempts, setScanAttempts] = useState(0)
  const [result, setResult] = useState(null)
  const [busyCheck, setBusyCheck] = useState(false)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const checkingRef = useRef(false)

  const loadSummary = useCallback(async () => {
    if (!user) return
    try {
      const res = await authFetch(`/api/events/${id}/door/summary`)
      const data = await res.json()
      if (data?.ok) {
        setSummary(data.summary)
        setEventInfo(data.event)
      }
    } catch (err) {
      if (err?.message !== 'token_expired') setError('No se pudo cargar el resumen de puerta.')
    }
  }, [user, authFetch, id])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }, [])

  const handleQrPayload = useCallback(
    async (raw) => {
      if (checkingRef.current) return
      checkingRef.current = true
      setBusyCheck(true)
      setError('')
      try {
        stopCamera()
        const res = await authFetch(`/api/events/${id}/door/check`, {
          method: 'POST',
          body: JSON.stringify({ qrData: raw, checkIn: true }),
        })
        const data = await res.json()
        if (data?.ok) {
          setResult({
            status: data.status,
            message: data.message,
            attendee: data.attendee,
            ticket: data.ticket,
          })
          await loadSummary()
        } else {
          setResult({
            status: data?.error || 'invalid',
            message: data?.message || 'Entrada no válida.',
            attendee: null,
            ticket: null,
          })
        }
      } catch (err) {
        if (err?.message !== 'token_expired') {
          setResult({
            status: 'error',
            message: 'Error de red al validar.',
            attendee: null,
            ticket: null,
          })
        }
      } finally {
        checkingRef.current = false
        setBusyCheck(false)
      }
    },
    [authFetch, id, loadSummary, stopCamera],
  )

  const startQRDetection = useCallback(() => {
    const detectQR = () => {
      if (
        videoRef.current &&
        canvasRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
      ) {
        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = 640
        canvas.height = 480
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        })
        if (code?.data) {
          handleQrPayload(code.data)
          return
        }
        setScanAttempts((n) => (n > 200 ? 0 : n + 1))
      }
      if (streamRef.current) {
        animationFrameRef.current = requestAnimationFrame(detectQR)
      }
    }
    detectQR()
  }, [handleQrPayload])

  useEffect(() => {
    if (!scanning || !streamRef.current || !videoRef.current) return
    const video = videoRef.current
    video.srcObject = streamRef.current
    const onReady = () => {
      video.play().catch(() => {})
      startQRDetection()
    }
    video.onloadedmetadata = onReady
    if (video.readyState >= 2) onReady()
  }, [scanning, startQRDetection])

  const startCamera = async () => {
    setResult(null)
    setError('')
    setCameraLoading(true)
    setScanAttempts(0)

    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    if (!window.isSecureContext && !isLocalhost) {
      setCameraLoading(false)
      setError('La cámara requiere HTTPS o localhost.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })
      streamRef.current = stream
      setScanning(true)
    } catch (err) {
      setError(err?.message || 'No se pudo acceder a la cámara.')
    } finally {
      setCameraLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setError('')
    startCamera()
  }

  const statusClass =
    result?.status === 'checked_in'
      ? 'ok'
      : result?.status === 'already_checked_in'
        ? 'warn'
        : 'err'

  return (
    <div className="mi-evento-page door-page">
      <div className="page-title-block">
        <div className="badge-gradient">Puerta</div>
        <h1 style={{ marginTop: '0.5rem' }}>Control de puerta</h1>
        <p>
          {eventInfo
            ? `${eventInfo.title} · ${eventInfo.date} · ${eventInfo.location}`
            : 'Validá entradas pagadas, emitidas y Free Pass de este evento.'}
        </p>
      </div>

      <div className="door-actions-top">
        <Link className="btn btn-secondary btn-sm" to={`/event/${id}/attendees`}>
          Ver asistentes
        </Link>
        <Link className="btn btn-secondary btn-sm" to={`/event/${id}/edit`}>
          Editar evento
        </Link>
      </div>

      {summary && (
        <div className="door-summary">
          <div className="door-stat">
            <strong>{summary.checkedIn}</strong>
            <span>Ingresaron</span>
          </div>
          <div className="door-stat">
            <strong>{summary.pending}</strong>
            <span>Pendientes</span>
          </div>
          <div className="door-stat">
            <strong>{summary.total}</strong>
            <span>Total entradas</span>
          </div>
          <div className="door-stat muted-stat">
            <strong>{summary.purchase}</strong>
            <span>Online</span>
          </div>
        </div>
      )}

      {error && <p className="empty">{error}</p>}

      <section className="mi-evento-list-section door-scanner-card">
        {!scanning && !cameraLoading && !result && (
          <div className="door-start">
            <ScanLine size={48} className="door-start-icon" />
            <p>Escaneá el QR de la entrada para validar el ingreso.</p>
            <button type="button" className="btn btn-primary" onClick={startCamera}>
              <Camera size={18} /> Iniciar escáner
            </button>
          </div>
        )}

        {cameraLoading && (
          <div className="door-start">
            <Loader size={40} className="spinning" />
            <p>Iniciando cámara...</p>
          </div>
        )}

        {scanning && (
          <div className="door-camera">
            <div className="door-video-wrap">
              <video ref={videoRef} autoPlay playsInline muted className="door-video" />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="door-frame" />
            </div>
            <p className="muted" style={{ textAlign: 'center', marginTop: 8 }}>
              Escaneando... {scanAttempts > 0 ? `(${scanAttempts})` : ''}
              {busyCheck ? ' · Validando...' : ''}
            </p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={stopCamera}>
              Detener
            </button>
          </div>
        )}

        {result && (
          <div className={`door-result ${statusClass}`}>
            <div className="door-result-icon">
              {statusClass === 'ok' && <CheckCircle size={40} />}
              {statusClass === 'warn' && <AlertTriangle size={40} />}
              {statusClass === 'err' && <XCircle size={40} />}
            </div>
            <h2>
              {result.status === 'checked_in' && 'Ingreso válido'}
              {result.status === 'already_checked_in' && 'Ya ingresó'}
              {statusClass === 'err' && 'Entrada no válida'}
            </h2>
            <p>{result.message}</p>
            {result.attendee && (
              <div className="door-attendee">
                <strong>{result.attendee.fullName}</strong>
                <span>{result.attendee.label || result.ticket?.tier || '—'}</span>
                <span className="muted">{sourceLabel(result.attendee.source)}</span>
                {result.attendee.verifiedAt && (
                  <span className="muted">
                    Check-in: {new Date(result.attendee.verifiedAt).toLocaleString('es-AR')}
                  </span>
                )}
              </div>
            )}
            <button type="button" className="btn btn-primary" onClick={reset} disabled={loading}>
              Escanear siguiente
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
