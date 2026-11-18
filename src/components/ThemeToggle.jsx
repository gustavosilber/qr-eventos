import React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/ThemeProvider'

const LABELS = {
  system: 'Tema automático (sistema)',
  light: 'Modo claro',
  dark: 'Modo oscuro',
}

export default function ThemeToggle({ className = 'topbar-icon-btn' }) {
  const { theme, cycleTheme } = useTheme()

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <button
      type="button"
      className={className}
      onClick={cycleTheme}
      title={LABELS[theme]}
      aria-label={LABELS[theme]}
    >
      <Icon size={16} />
    </button>
  )
}
