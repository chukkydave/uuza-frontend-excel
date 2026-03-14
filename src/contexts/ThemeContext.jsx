import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('theme')
    if (saved) {
      return saved === 'dark'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    
    // Update document class for Tailwind dark mode
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const theme = {
    isDark,
    toggleTheme,
    // Theme-aware classes
    bg: {
      primary: isDark 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
      secondary: isDark 
        ? 'bg-gradient-to-br from-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-white to-gray-50',
      card: isDark 
        ? 'bg-white/5 backdrop-blur-sm border border-white/10' 
        : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg',
      nav: isDark 
        ? 'bg-white/10 backdrop-blur-md border-b border-white/20' 
        : 'bg-white/90 backdrop-blur-md border-b border-gray-200',
      footer: isDark 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black' 
        : 'bg-gradient-to-br from-gray-800 via-gray-900 to-black'
    },
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      muted: isDark ? 'text-gray-400' : 'text-gray-500',
      accent: isDark ? 'text-cyan-400' : 'text-blue-600',
      gradient: isDark 
        ? 'bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent'
        : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
    },
    button: {
      primary: isDark
        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white'
        : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white',
      secondary: isDark
        ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20'
        : 'bg-gray-100 border border-gray-300 text-gray-900 hover:bg-gray-200'
    },
    hover: {
      card: isDark ? 'hover:bg-white/10' : 'hover:bg-white hover:shadow-xl',
      link: isDark ? 'hover:text-cyan-400' : 'hover:text-blue-600'
    }
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}
