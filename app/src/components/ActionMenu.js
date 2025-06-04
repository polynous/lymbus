import React, { useState, useRef, useEffect } from 'react';
import { FiMoreVertical, FiHash, FiEye, FiLogIn } from 'react-icons/fi';
import { useTheme } from '../hooks/useTheme';

const ActionMenu = ({ student, onGenerateQR, onViewProfile, onRegisterEntry, isPresent, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { darkMode } = useTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        onClick={toggleMenu}
        className={`p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          darkMode 
            ? 'text-white hover:bg-slate-700/50' 
            : 'text-gray-500 hover:bg-gray-100'
        }`}
        aria-label="Más opciones"
      >
        <FiMoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 ${
          darkMode 
            ? 'bg-slate-800/95 ring-slate-700/50' 
            : 'bg-white ring-gray-200'
        }`}>
          <div className={`py-1 divide-y ${
            darkMode ? 'divide-slate-700/50' : 'divide-gray-100'
          }`} role="menu" aria-orientation="vertical">
            <div>
              {!isPresent && onRegisterEntry && (
                <button
                  onClick={() => {
                    onRegisterEntry(student.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                    darkMode 
                      ? 'text-slate-300 hover:bg-slate-700/50' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                >
                  <FiLogIn className="mr-3 h-4 w-4" />
                  Registrar entrada
                </button>
              )}
              
              <button
                onClick={() => {
                  onGenerateQR(student);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                  darkMode 
                    ? 'text-slate-300 hover:bg-slate-700/50' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                role="menuitem"
              >
                <FiHash className="mr-3 h-4 w-4" />
                Generar código QR
              </button>
              
              {onViewProfile && (
                <button
                  onClick={() => {
                    onViewProfile(student);
                    setIsOpen(false);
                  }}
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                    darkMode 
                      ? 'text-slate-300 hover:bg-slate-700/50' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                >
                  <FiEye className="mr-3 h-4 w-4" />
                  Ver perfil
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMenu; 