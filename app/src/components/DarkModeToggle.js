import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

const DarkModeToggle = ({ 
  className = '', 
  size = 'md', 
  showSystemOption = false,
  variant = 'default' // 'default', 'minimal', 'bordered'
}) => {
  const { darkMode, toggleDarkMode, isTransitioning, resetToSystemPreference, getSystemPreference } = useTheme();

  const sizeClasses = {
    sm: 'p-1.5 w-8 h-8',
    md: 'p-2.5 w-10 h-10',
    lg: 'p-3 w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getVariantClasses = () => {
    const baseClasses = `
      relative rounded-xl transition-all duration-300 ease-out 
      focus:outline-none focus:ring-2 focus:ring-opacity-50 group overflow-hidden
      transform-gpu will-change-transform
      ${isTransitioning ? 'scale-95' : 'hover:scale-105 active:scale-95'}
    `;

    switch (variant) {
      case 'minimal':
        return `${baseClasses} 
          ${darkMode 
            ? 'bg-amber-100/80 text-amber-800 hover:bg-amber-200/80 focus:ring-amber-400' 
            : 'bg-slate-700/80 text-slate-200 hover:bg-slate-600/80 focus:ring-slate-400'
          }`;
      
      case 'bordered':
        return `${baseClasses}
          border-2 backdrop-blur-sm
          ${darkMode 
            ? 'bg-gradient-to-br from-amber-50/90 to-orange-100/90 text-amber-800 border-amber-200 hover:from-amber-100/90 hover:to-orange-200/90 focus:ring-amber-400' 
            : 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 text-slate-200 border-slate-600 hover:from-slate-700/90 hover:to-slate-800/90 focus:ring-slate-400'
          }`;
      
      default:
        return `${baseClasses}
          shadow-lg backdrop-blur-sm
          ${darkMode 
            ? 'bg-gradient-to-br from-amber-100 to-orange-200 text-amber-800 hover:from-amber-200 hover:to-orange-300 focus:ring-amber-400' 
            : 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 hover:from-slate-600 hover:to-slate-700 focus:ring-slate-400'
          }`;
    }
  };

  if (showSystemOption) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        {/* System theme button */}
        <button
          onClick={resetToSystemPreference}
          className={`${sizeClasses[size]} ${getVariantClasses()} opacity-70 hover:opacity-100`}
          aria-label="Usar preferencia del sistema"
          title="Usar preferencia del sistema"
        >
          <FiMonitor className={`${iconSizes[size]} transition-all duration-300`} />
        </button>
        
        {/* Main toggle button */}
        <button
          onClick={toggleDarkMode}
          className={`${sizeClasses[size]} ${getVariantClasses()}`}
          aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          disabled={isTransitioning}
        >
          <ThemeToggleContent darkMode={darkMode} iconSize={iconSizes[size]} isTransitioning={isTransitioning} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggleDarkMode}
      className={`${sizeClasses[size]} ${getVariantClasses()} ${className}`}
      aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      disabled={isTransitioning}
    >
      <ThemeToggleContent darkMode={darkMode} iconSize={iconSizes[size]} isTransitioning={isTransitioning} />
    </button>
  );
};

// Separate component for the toggle content to avoid repetition
const ThemeToggleContent = ({ darkMode, iconSize, isTransitioning }) => (
  <>
    {/* Simplified animated background glow */}
    <div className={`absolute inset-0 rounded-xl transition-all duration-300 ease-out ${
      darkMode 
        ? 'bg-gradient-to-br from-yellow-300/20 to-orange-400/20 opacity-0 group-hover:opacity-100' 
        : 'bg-gradient-to-br from-blue-500/15 to-purple-600/15 opacity-0 group-hover:opacity-100'
    }`} />
    
    <div className={`relative ${iconSize}`}>
      {/* Light mode icon (Moon) - visible when in light mode */}
      <FiMoon 
        className={`absolute inset-0 ${iconSize} transition-all duration-600 ease-out ${
          darkMode 
            ? 'opacity-0 scale-50 rotate-180' 
            : 'opacity-100 scale-100 rotate-0'
        }`}
        style={{
          transitionProperty: 'opacity, transform',
          transitionDuration: darkMode ? '600ms, 500ms' : '50ms, 400ms'
        }}
      />
      
      {/* Dark mode icon (Sun) - visible when in dark mode */}
      <FiSun 
        className={`absolute inset-0 ${iconSize} transition-all duration-600 ease-out ${
          darkMode 
            ? 'opacity-100 scale-100 rotate-0' 
            : 'opacity-0 scale-50 rotate-180'
        }`}
        style={{
          transitionProperty: 'opacity, transform',
          transitionDuration: darkMode ? '50ms, 400ms' : '600ms, 500ms'
        }}
      />
    </div>
    
    {/* Simplified indicator dot */}
    <div className={`absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-300 ease-out ${
      darkMode 
        ? 'bg-amber-600 opacity-80' 
        : 'bg-slate-300 opacity-60'
    }`} />
  </>
);

export default DarkModeToggle; 