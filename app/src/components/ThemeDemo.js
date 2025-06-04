import React from 'react';
import { useTheme } from '../hooks/useTheme';
import DarkModeToggle from './DarkModeToggle';
import GlassButton from './GlassButton';
import { FiSun, FiMoon, FiStar, FiHeart, FiCheck, FiX, FiAlert } from 'react-icons/fi';

const ThemeDemo = () => {
  const { darkMode, isTransitioning } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8 transition-all duration-400">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="glass-card p-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Unified Theme System
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
            Demonstración del sistema unificado de temas con transiciones suaves y radios de borde consistentes
          </p>
          
          {/* Theme Controls */}
          <div className="flex items-center justify-center space-x-4">
            <DarkModeToggle size="lg" variant="default" />
            <DarkModeToggle size="md" variant="minimal" />
            <DarkModeToggle size="sm" variant="bordered" />
            <DarkModeToggle size="md" variant="default" showSystemOption={true} />
          </div>
          
          {isTransitioning && (
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400 animate-pulse">
              Transicionando entre temas...
            </div>
          )}
        </div>

        {/* Button Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CSS Button Classes */}
          <div className="glass-card p-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              CSS Button Classes
            </h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary">Primary</button>
                <button className="btn-secondary">Secondary</button>
                <button className="btn-success">Success</button>
                <button className="btn-warning">Warning</button>
                <button className="btn-danger">Danger</button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button className="glass-button">
                  <FiStar className="w-4 h-4" />
                  Glass Button
                </button>
                <button className="glass-button" disabled>
                  <FiX className="w-4 h-4" />
                  Disabled
                </button>
              </div>
            </div>
          </div>

          {/* React Component Buttons */}
          <div className="glass-card p-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              React Button Components
            </h2>
            <div className="space-y-4">
              {/* Size variations */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Sizes</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <GlassButton size="sm" variant="primary">
                    <FiCheck className="w-3 h-3" />
                    Small
                  </GlassButton>
                  <GlassButton size="md" variant="primary">
                    <FiCheck className="w-4 h-4" />
                    Medium
                  </GlassButton>
                  <GlassButton size="lg" variant="primary">
                    <FiCheck className="w-5 h-5" />
                    Large
                  </GlassButton>
                </div>
              </div>

              {/* Variant styles */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <GlassButton variant="primary">
                    <FiStar className="w-4 h-4" />
                    Primary
                  </GlassButton>
                  <GlassButton variant="secondary">
                    <FiHeart className="w-4 h-4" />
                    Secondary
                  </GlassButton>
                  <GlassButton variant="outline">
                    <FiAlert className="w-4 h-4" />
                    Outline
                  </GlassButton>
                  <GlassButton variant="success">
                    <FiCheck className="w-4 h-4" />
                    Success
                  </GlassButton>
                  <GlassButton variant="warning">
                    <FiAlert className="w-4 h-4" />
                    Warning
                  </GlassButton>
                  <GlassButton variant="danger">
                    <FiX className="w-4 h-4" />
                    Danger
                  </GlassButton>
                </div>
              </div>

              {/* Border radius variations */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Border Radius</h3>
                <div className="flex flex-wrap gap-3">
                  <GlassButton borderRadius="xs" variant="primary">XS</GlassButton>
                  <GlassButton borderRadius="sm" variant="primary">SM</GlassButton>
                  <GlassButton borderRadius="md" variant="primary">MD</GlassButton>
                  <GlassButton borderRadius="lg" variant="primary">LG</GlassButton>
                  <GlassButton borderRadius="xl" variant="primary">XL</GlassButton>
                  <GlassButton borderRadius="full" variant="primary">
                    <FiHeart className="w-4 h-4" />
                  </GlassButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Status Badges & Elements
          </h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <span className="status-badge status-present">
                <FiCheck className="w-3 h-3" />
                Presente
              </span>
              <span className="status-badge status-absent">
                <FiX className="w-3 h-3" />
                Ausente
              </span>
              <span className="status-badge status-warning">
                <FiAlert className="w-3 h-3" />
                Advertencia
              </span>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <kbd className="kbd">Ctrl</kbd>
              <kbd className="kbd">+</kbd>
              <kbd className="kbd">K</kbd>
              <span className="text-sm text-slate-600 dark:text-slate-400">Atajos de teclado</span>
            </div>
          </div>
        </div>

        {/* Cards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 card-hover">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Glass Card Primary
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Tarjeta principal con efectos de glassmorphism y hover.
            </p>
            <button className="btn-primary w-full">Acción</button>
          </div>

          <div className="glass-card-secondary p-6 card-hover">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Glass Card Secondary
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Tarjeta secundaria con styling diferenciado.
            </p>
            <button className="btn-secondary w-full">Acción</button>
          </div>

          <div className="glass-card-strong p-6 card-hover">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Glass Card Strong
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Tarjeta con mayor opacidad para contenido importante.
            </p>
            <button className="btn-success w-full">Acción</button>
          </div>
        </div>

        {/* Theme Information */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Sistema de Temas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-3">
                Características del Sistema
              </h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li>• Transiciones suaves de 400ms</li>
                <li>• Sistema de radios de borde unificado</li>
                <li>• Variables CSS consistentes</li>
                <li>• Soporte para preferencias del sistema</li>
                <li>• Compatibilidad con modo oscuro</li>
                <li>• Animaciones optimizadas</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-3">
                Estado Actual
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Tema actual:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {darkMode ? 'Oscuro' : 'Claro'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Transicionando:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {isTransitioning ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Animaciones:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    Habilitadas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo; 