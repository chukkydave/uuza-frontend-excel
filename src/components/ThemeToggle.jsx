import { useTheme } from '../contexts/ThemeContext'

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isDark 
          ? 'bg-gradient-to-r from-purple-500 to-cyan-500 focus:ring-cyan-400' 
          : 'bg-gradient-to-r from-blue-400 to-purple-400 focus:ring-blue-400'
      } ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Toggle circle */}
      <span
        className={`inline-block w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
          isDark ? 'translate-x-3' : '-translate-x-3'
        }`}
      >
        {/* Icon inside the circle */}
        <span className="flex items-center justify-center w-full h-full text-xs">
          {isDark ? '🌙' : '☀️'}
        </span>
      </span>
      
      {/* Background icons */}
      <span className="absolute left-1 text-xs opacity-70">
        ☀️
      </span>
      <span className="absolute right-1 text-xs opacity-70">
        🌙
      </span>
    </button>
  )
}

export default ThemeToggle
