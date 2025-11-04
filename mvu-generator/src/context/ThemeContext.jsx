import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'mvu-generator-theme'
const ThemeContext = createContext(null)

const getPreferredTheme = () => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  let nextTheme = 'light'

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    nextTheme = stored
  } else {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    nextTheme = mediaQuery?.matches ? 'dark' : 'light'
  }

  const root = window.document.documentElement
  root.classList.toggle('dark', nextTheme === 'dark')
  root.style.colorScheme = nextTheme === 'dark' ? 'dark' : 'light'

  return nextTheme
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getPreferredTheme)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
