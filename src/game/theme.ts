import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'election-simulator-theme'

function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // storage can be unavailable in private windows
    }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), [])
  return [theme, toggle]
}

export function applyStoredTheme(): void {
  document.documentElement.dataset.theme = readTheme()
}
