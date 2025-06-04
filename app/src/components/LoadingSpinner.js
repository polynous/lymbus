import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary', 
  text = '', 
  fullScreen = false,
  overlay = false 
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'h-4 w-4';
      case 'sm':
        return 'h-6 w-6';
      case 'md':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      case 'xl':
        return 'h-16 w-16';
      default:
        return 'h-8 w-8';
    }
  };

  const getColorClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-blue-600 dark:text-blue-400';
      case 'secondary':
        return 'text-slate-600 dark:text-slate-400';
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      case 'white':
        return 'text-white';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const SpinnerSVG = () => (
    <svg
      className={`animate-spin ${getSizeClasses()} ${getColorClasses()}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const DotsSpinner = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${getSizeClasses().replace('h-', 'h-').replace('w-', 'w-')} rounded-full ${getColorClasses().replace('text-', 'bg-')} animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  const PulseSpinner = () => (
    <div className={`${getSizeClasses()} relative`}>
      <div className={`absolute inset-0 rounded-full ${getColorClasses().replace('text-', 'bg-')} animate-ping opacity-75`} />
      <div className={`relative rounded-full ${getSizeClasses()} ${getColorClasses().replace('text-', 'bg-')}`} />
    </div>
  );

  const BarsSpinner = () => (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1 ${getColorClasses().replace('text-', 'bg-')} animate-pulse`}
          style={{
            height: `${12 + (i % 2) * 8}px`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1.2s'
          }}
        />
      ))}
    </div>
  );

  const getSpinnerComponent = () => {
    switch (variant) {
      case 'dots':
        return <DotsSpinner />;
      case 'pulse':
        return <PulseSpinner />;
      case 'bars':
        return <BarsSpinner />;
      default:
        return <SpinnerSVG />;
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-3">
      {getSpinnerComponent()}
      {text && (
        <p className={`text-sm font-medium ${getColorClasses()} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton Loading Component
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '',
  avatar = false,
  button = false 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex space-x-4">
        {avatar && (
          <div className="rounded-full bg-slate-200 dark:bg-slate-700 h-12 w-12" />
        )}
        <div className="flex-1 space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-slate-200 dark:bg-slate-700 rounded"
              style={{
                width: `${Math.random() * 40 + 60}%`
              }}
            />
          ))}
          {button && (
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24 mt-4" />
          )}
        </div>
      </div>
    </div>
  );
};

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        {/* Header */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-300 dark:bg-slate-600 rounded" />
          ))}
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-4 bg-slate-200 dark:bg-slate-700 rounded"
                style={{
                  width: `${Math.random() * 30 + 70}%`
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Card Skeleton
export const CardSkeleton = ({ 
  hasImage = false, 
  hasButton = false,
  className = '' 
}) => {
  return (
    <div className={`glass-card p-6 animate-pulse ${className}`}>
      {hasImage && (
        <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4" />
      )}
      <div className="space-y-3">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
        {hasButton && (
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-32 mt-4" />
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner; 