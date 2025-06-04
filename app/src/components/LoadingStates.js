import React from 'react';
import { FiLoader, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi';

// Skeleton loader for content
export const SkeletonLoader = ({ className = "", lines = 3, height = "h-4" }) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={`bg-slate-200 dark:bg-slate-700 rounded ${height} ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      />
    ))}
  </div>
);

// Card skeleton loader
export const CardSkeletonLoader = ({ count = 3, className = "" }) => (
  <div className={`grid gap-6 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="glass-card p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
        </div>
      </div>
    ))}
  </div>
);

// Table skeleton loader
export const TableSkeletonLoader = ({ rows = 5, cols = 4, className = "" }) => (
  <div className={`glass-card overflow-hidden ${className}`}>
    <div className="animate-pulse">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, index) => (
            <div key={`header-${index}`} className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div 
                key={`cell-${rowIndex}-${colIndex}`} 
                className={`h-3 bg-slate-200 dark:bg-slate-700 rounded ${
                  colIndex === cols - 1 ? 'w-2/3' : 'w-full'
                }`}
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Enhanced spinner with context
export const LoadingSpinner = ({ 
  size = "md", 
  text = "Cargando...", 
  subtext = null,
  icon: Icon = FiLoader,
  className = ""
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };
  
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg", 
    xl: "text-xl"
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="relative">
        <Icon className={`${sizeClasses[size]} text-blue-500 animate-spin`} />
        <div className="absolute inset-0 border-2 border-blue-100 dark:border-blue-900 rounded-full animate-pulse"></div>
      </div>
      
      {text && (
        <div className="text-center">
          <p className={`font-medium text-slate-700 dark:text-slate-300 ${textSizeClasses[size]}`}>
            {text}
          </p>
          {subtext && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Search loading state
export const SearchLoadingState = ({ className = "" }) => (
  <div className={`glass-card p-8 text-center ${className}`}>
    <LoadingSpinner 
      icon={FiSearch}
      size="lg"
      text="Buscando alumnos..."
      subtext="Esto no debería tardar mucho"
    />
  </div>
);

// Empty state component
export const EmptyState = ({ 
  title = "No se encontraron resultados",
  description = "Intenta ajustar los filtros de búsqueda",
  icon: Icon = FiUsers,
  action = null,
  className = ""
}) => (
  <div className={`glass-card p-12 text-center ${className}`}>
    <div className="flex flex-col items-center space-y-4">
      <div className="icon-container-lg icon-secondary">
        <Icon className="h-8 w-8" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
          {title}
        </h3>
        <p className="text-slate-500 dark:text-slate-500 max-w-md">
          {description}
        </p>
      </div>
      
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  </div>
);

// Error state component
export const ErrorState = ({ 
  title = "Error al cargar datos",
  description = "Ha ocurrido un error inesperado. Por favor, intenta de nuevo.",
  onRetry = null,
  className = ""
}) => (
  <div className={`glass-card p-8 text-center ${className}`}>
    <div className="flex flex-col items-center space-y-4">
      <div className="icon-container-lg icon-error">
        <FiRefreshCw className="h-6 w-6" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
          {title}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          {description}
        </p>
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary flex items-center space-x-2"
        >
          <FiRefreshCw className="h-4 w-4" />
          <span>Reintentar</span>
        </button>
      )}
    </div>
  </div>
);

// Loading overlay for existing content
export const LoadingOverlay = ({ 
  isLoading = false, 
  text = "Cargando...",
  children,
  className = ""
}) => (
  <div className={`relative ${className}`}>
    {children}
    
    {isLoading && (
      <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
        <LoadingSpinner text={text} />
      </div>
    )}
  </div>
);

// Progress indicator
export const ProgressIndicator = ({ 
  progress = 0, 
  text = "Procesando...",
  showPercentage = true,
  className = ""
}) => (
  <div className={`space-y-3 ${className}`}>
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600 dark:text-slate-400">{text}</span>
      {showPercentage && (
        <span className="text-slate-500 dark:text-slate-500">{Math.round(progress)}%</span>
      )}
    </div>
    
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);

const LoadingStates = {
  SkeletonLoader,
  CardSkeletonLoader,
  TableSkeletonLoader,
  LoadingSpinner,
  SearchLoadingState,
  EmptyState,
  ErrorState,
  LoadingOverlay,
  ProgressIndicator
};

export default LoadingStates; 