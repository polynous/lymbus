import React from 'react';

// Glass Button component with glassmorphism effects and unified design system
const GlassButton = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, success, warning, danger
  size = 'md', // sm, md, lg
  disabled = false,
  className = '',
  borderRadius = 'md', // xs, sm, md, lg, xl, full
  ...props
}) => {
  // Variant styles with improved theming
  const variantStyles = {
    primary: `
      bg-primary-500/90 dark:bg-primary-600/90 
      text-white dark:text-gray-50
      hover:bg-primary-600/90 dark:hover:bg-primary-700/90 
      backdrop-blur-sm
      border border-primary-400/30 dark:border-primary-700/50
      shadow-lg shadow-primary-500/25
    `,
    secondary: `
      bg-slate-200/80 dark:bg-slate-800/80 
      text-slate-800 dark:text-slate-100
      hover:bg-slate-300/80 dark:hover:bg-slate-700/80 
      backdrop-blur-sm
      border border-slate-300/50 dark:border-slate-600/50
      shadow-lg shadow-slate-500/25
    `,
    outline: `
      bg-transparent 
      text-primary-600 dark:text-primary-400
      hover:bg-primary-50/30 dark:hover:bg-primary-900/20 
      backdrop-blur-sm
      border border-primary-300 dark:border-primary-700
      shadow-lg shadow-primary-500/10
    `,
    success: `
      bg-green-500/90 dark:bg-green-600/90 
      text-white dark:text-gray-50
      hover:bg-green-600/90 dark:hover:bg-green-700/90 
      backdrop-blur-sm
      border border-green-400/30 dark:border-green-700/50
      shadow-lg shadow-green-500/25
    `,
    warning: `
      bg-amber-500/90 dark:bg-amber-600/90 
      text-white dark:text-gray-50
      hover:bg-amber-600/90 dark:hover:bg-amber-700/90 
      backdrop-blur-sm
      border border-amber-400/30 dark:border-amber-700/50
      shadow-lg shadow-amber-500/25
    `,
    danger: `
      bg-red-500/90 dark:bg-red-600/90 
      text-white dark:text-gray-50
      hover:bg-red-600/90 dark:hover:bg-red-700/90 
      backdrop-blur-sm
      border border-red-400/30 dark:border-red-700/50
      shadow-lg shadow-red-500/25
    `,
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Border radius mapping to CSS custom properties
  const radiusStyles = {
    xs: 'rounded-sm', // Uses var(--radius-xs) via Tailwind
    sm: 'rounded',    // Uses var(--radius-sm) via Tailwind
    md: 'rounded-md', // Uses var(--radius-md) via Tailwind
    lg: 'rounded-lg', // Uses var(--radius-lg) via Tailwind
    xl: 'rounded-xl', // Uses var(--radius-xl) via Tailwind
    full: 'rounded-full', // Uses var(--radius-full) via Tailwind
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden font-medium inline-flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
        transition-all duration-300 ease-out transform-gpu will-change-transform
        ${sizeStyles[size]}
        ${radiusStyles[borderRadius]}
        ${variantStyles[variant]}
        ${disabled 
          ? 'opacity-50 cursor-not-allowed scale-100' 
          : 'cursor-pointer hover:scale-105 hover:-translate-y-0.5 active:scale-95'
        }
        ${className}
      `}
      {...props}
    >
      {/* Enhanced noise overlay with theme support */}
      <div className="absolute inset-0 bg-noise opacity-[.02] dark:opacity-[.01] z-0 transition-opacity duration-300"></div>
      
      {/* Animated background highlight */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out z-10"></div>
      
      {/* Content */}
      <div className="relative z-20 flex items-center justify-center gap-2">
        {children}
      </div>
    </button>
  );
};

export default GlassButton; 