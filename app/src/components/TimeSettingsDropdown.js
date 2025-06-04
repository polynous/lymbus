import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiSettings, FiSave, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { useNotification } from './NotificationSystem';

const TimeSettingsDropdown = ({ 
  schoolTimes, 
  onTimeChange, 
  onSaveSettings,
  isVisible, 
  onClose,
  triggerRef 
}) => {
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [tempTimes, setTempTimes] = useState(schoolTimes);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef(null);
  const { success } = useNotification();

  // Update temp times when school times change
  useEffect(() => {
    setTempTimes(schoolTimes);
  }, [schoolTimes]);

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const dropdownWidth = 320; // 20rem
      const dropdownHeight = 280; // estimated height
      
      let top = rect.bottom + 8;
      let right = viewportWidth - rect.right;
      
      // Adjust if dropdown would go off-screen horizontally
      if (rect.right - dropdownWidth < 0) {
        right = 16; // Minimum margin from edge
      }
      
      // Adjust if dropdown would go off-screen vertically
      if (top + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 8; // Position above
      }
      
      setDropdownPosition({ top, right });
    }
  };

  // Update position when dropdown opens
  useEffect(() => {
    if (isVisible) {
      updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isVisible]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          triggerRef?.current && !triggerRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isVisible, onClose]);

  const handleTempTimeChange = (field, value) => {
    setTempTimes(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate times
      const startTime = new Date(`2024-01-01T${tempTimes.startTime}`);
      const endTime = new Date(`2024-01-01T${tempTimes.endTime}`);
      
      if (endTime <= startTime) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio');
      }

      // Update parent component
      onTimeChange('startTime', tempTimes.startTime);
      onTimeChange('endTime', tempTimes.endTime);
      
      // Save settings
      await onSaveSettings();
      
      success('Horarios actualizados correctamente');
      onClose();
    } catch (error) {
      // Error will be handled by parent component
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempTimes(schoolTimes); // Reset to original values
    onClose();
  };

  if (!isVisible) return null;

  const DropdownContent = () => (
    <div
      ref={dropdownRef}
      className="fixed w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden backdrop-blur-sm z-50"
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
        zIndex: 9999
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Configuración de horarios"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center space-x-2">
          <FiSettings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Configurar Horarios
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Cerrar configuración"
        >
          <FiX className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <FiClock className="inline h-4 w-4 mr-1" />
              Hora de inicio de clases
            </label>
            <input
              type="time"
              value={tempTimes.startTime}
              onChange={(e) => handleTempTimeChange('startTime', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <FiClock className="inline h-4 w-4 mr-1" />
              Hora de fin de clases
            </label>
            <input
              type="time"
              value={tempTimes.endTime}
              onChange={(e) => handleTempTimeChange('endTime', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100 transition-colors"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Vista previa</div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Jornada escolar: {tempTimes.startTime} - {tempTimes.endTime}
          </div>
          <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
            Duración: {(() => {
              const start = new Date(`2024-01-01T${tempTimes.startTime}`);
              const end = new Date(`2024-01-01T${tempTimes.endTime}`);
              const diffMs = end - start;
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              return `${diffHours}h ${diffMinutes}m`;
            })()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center space-x-2 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
          ) : (
            <FiSave className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          <FiX className="h-4 w-4 mr-2" />
          Cancelar
        </button>
      </div>
    </div>
  );

  return createPortal(<DropdownContent />, document.body);
};

export default TimeSettingsDropdown; 