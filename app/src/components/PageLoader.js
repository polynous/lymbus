import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const PageLoader = ({ text = "Cargando...", showBackground = true }) => {
  return (
    <div className={`min-h-screen flex items-center justify-center ${
      showBackground ? 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900' : ''
    }`}>
      <div className="glass-card p-8 animate-fade-in-scale">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-lg font-medium text-primary animate-pulse">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageLoader; 