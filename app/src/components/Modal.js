import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'default', // 'sm', 'default', 'lg', 'xl'
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e) => {
    if (closeOnEscape && e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen && closeOnEscape) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Full screen backdrop with proper dark mode support */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-lg transition-all duration-300" />
      
      {/* Modal container for perfect viewport centering */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className={`relative w-full ${sizeClasses[size]}`}>
          <div className={`glass-card p-6 w-full animate-fade-in-scale shadow-2xl max-h-[90vh] overflow-y-auto ${className}`}>
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between mb-6">
                {title && (
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${!title ? 'ml-auto' : ''}`}
                    aria-label="Cerrar modal"
                  >
                    <FiX className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                  </button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="text-slate-700 dark:text-slate-300">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal; 