import React from 'react';

// Glass card component with unified glassmorphism effects
const GlassCard = ({ children, className = '', variant = 'primary', ...props }) => {
  const variantClasses = {
    primary: 'glass-card',
    secondary: 'glass-card-secondary',
    strong: 'glass-card-strong'
  };

  return (
    <div
      className={`${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard; 