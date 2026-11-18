import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext(null)
const STORAGE_KEY = 'qr-eventos:user'
const LOGIN_REASON_KEY = 'qr-eventos:login-reason'

export function isIdTokenExpired(idToken, bufferSec = 30) {
  if (!idToken) return true
  try {
    const { exp } = jwtDecode(idToken)
    return !exp || Date.now() >= (exp - bufferSec) * 1000
  } catch {
    return true
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const user = raw ? JSON.parse(raw) : null
    if (user?.idToken && isIdTokenExpired(user.idToken)) return null
    return user
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)

  const expireSession = useCallback(() => {
    setUser(null)
    try {
      sessionStorage.setItem(LOGIN_REASON_KEY, 'session_expired')
    } catch {
      /* ignore */
    }
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    try {
      sessionStorage.removeItem(LOGIN_REASON_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  useEffect(() => {
    if (!user?.idToken) return undefined
    const tick = () => {
      if (isIdTokenExpired(user.idToken)) expireSession()
    }
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [user?.idToken, expireSession])

  const authFetch = useCallback(
    async (input, init = {}) => {
      if (!user?.idToken || isIdTokenExpired(user.idToken)) {
        expireSession()
        throw new Error('token_expired')
      }
      const headers = new Headers(init.headers || {})
      headers.set('Authorization', `Bearer ${user.idToken}`)
      if (typeof window !== 'undefined' && window.location?.origin) {
        headers.set('X-App-Origin', window.location.origin)
      }
      if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
      }
      const res = await fetch(input, { ...init, headers })
      if (res.status === 401) {
        expireSession()
        throw new Error('token_expired')
      }
      return res
    },
    [user, expireSession],
  )

  const value = useMemo(
    () => ({
      user,
      setUser,
      signOut,
      authFetch,
    }),
    [user, signOut, authFetch],
  )

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  if (clientId) {
    return (
      <GoogleOAuthProvider clientId={clientId}>
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      </GoogleOAuthProvider>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function consumeLoginReason() {
  try {
    const reason = sessionStorage.getItem(LOGIN_REASON_KEY)
    if (reason) sessionStorage.removeItem(LOGIN_REASON_KEY)
    return reason
  } catch {
    return null
  }
}
