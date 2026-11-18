import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'ticketfest:theme'
const ThemeContext = createContext(null)

function readStoredTheme() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* ignore */
  }
  return 'system'
}

export function applyTheme(mode) {
  const root = document.documentElement
  if (mode === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', mode)
  }
}

function resolveTheme(mode) {
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme)
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(readStoredTheme()))

  useLayoutEffect(() => {
    applyTheme(theme)
    setResolvedTheme(resolveTheme(theme))
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return undefined
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolvedTheme(resolveTheme('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (next) => {
        setThemeState(next)
        try {
          localStorage.setItem(STORAGE_KEY, next)
        } catch {
          /* ignore */
        }
        applyTheme(next)
        setResolvedTheme(resolveTheme(next))
      },
      cycleTheme: () => {
        const order = ['system', 'light', 'dark']
        const idx = order.indexOf(theme)
        const next = order[(idx + 1) % order.length]
        setThemeState(next)
        try {
          localStorage.setItem(STORAGE_KEY, next)
        } catch {
          /* ignore */
        }
        applyTheme(next)
        setResolvedTheme(resolveTheme(next))
      },
    }),
    [theme, resolvedTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
