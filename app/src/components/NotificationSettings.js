import React, { useState, useEffect } from 'react';
import { 
  FiBell, 
  FiVolume2, 
  FiVolumeX, 
  FiMonitor, 
  FiSettings, 
  FiFilter,
  FiClock,
  FiSave,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiZap,
  FiTarget,
  FiStar
} from 'react-icons/fi';
import {
  NotificationPreferences,
  requestDesktopNotificationPermission,
  playNotificationSound
} from '../utils/notificationHelpers';
import { useNotification } from './NotificationSystem';

const NotificationSettings = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    soundEnabled: true,
    autoMarkAsRead: false,
    desktopNotifications: false,
    defaultFilter: 'all',
    defaultSort: 'newest',
    playTestSound: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { success, error } = useNotification();

  // Load settings on component mount
  useEffect(() => {
    const loadedSettings = {
      soundEnabled: NotificationPreferences.getSoundEnabled(),
      autoMarkAsRead: NotificationPreferences.getAutoMarkAsRead(),
      desktopNotifications: NotificationPreferences.getDesktopNotifications(),
      defaultFilter: NotificationPreferences.getNotificationFilter(),
      defaultSort: NotificationPreferences.getNotificationSort()
    };
    setSettings(loadedSettings);
  }, [isOpen]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleDesktopNotificationToggle = async (enabled) => {
    if (enabled) {
      setIsLoading(true);
      try {
        const granted = await requestDesktopNotificationPermission();
        if (granted) {
          handleSettingChange('desktopNotifications', true);
          success('Notificaciones de escritorio habilitadas');
        } else {
          error('Permiso para notificaciones de escritorio denegado');
        }
      } catch (err) {
        error('Error al solicitar permisos de notificación');
      } finally {
        setIsLoading(false);
      }
    } else {
      handleSettingChange('desktopNotifications', false);
    }
  };

  const playTestSound = (type) => {
    if (settings.soundEnabled) {
      playNotificationSound(type);
    }
  };

  const saveSettings = () => {
    setIsLoading(true);
    
    try {
      // Save all settings to localStorage
      NotificationPreferences.setSoundEnabled(settings.soundEnabled);
      NotificationPreferences.setAutoMarkAsRead(settings.autoMarkAsRead);
      NotificationPreferences.setDesktopNotifications(settings.desktopNotifications);
      NotificationPreferences.setNotificationFilter(settings.defaultFilter);
      NotificationPreferences.setNotificationSort(settings.defaultSort);
      
      setHasUnsavedChanges(false);
      success('Configuración guardada exitosamente');
    } catch (err) {
      error('Error al guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      soundEnabled: true,
      autoMarkAsRead: false,
      desktopNotifications: false,
      defaultFilter: 'all',
      defaultSort: 'newest'
    };
    setSettings(defaultSettings);
    setHasUnsavedChanges(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FiSettings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Configuración de Notificaciones
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Personaliza tu experiencia de notificaciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FiX className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto max-h-[60vh]">
          {/* Sound Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <FiVolume2 className="h-5 w-5 text-blue-600" />
              <span>Sonidos</span>
            </h3>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Sonidos de notificación
                  </label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Reproduce sonidos cuando lleguen nuevas notificaciones
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.soundEnabled 
                      ? 'bg-blue-600' 
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {settings.soundEnabled && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Probar sonidos:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { type: 'success', label: 'Éxito', color: 'emerald' },
                      { type: 'error', label: 'Error', color: 'red' },
                      { type: 'warning', label: 'Advertencia', color: 'amber' },
                      { type: 'info', label: 'Info', color: 'blue' }
                    ].map(({ type, label, color }) => (
                      <button
                        key={type}
                        onClick={() => playTestSound(type)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                          ${color === 'emerald' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300' :
                            color === 'red' ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300' :
                            color === 'amber' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300' :
                            'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <FiMonitor className="h-5 w-5 text-blue-600" />
              <span>Notificaciones de Escritorio</span>
            </h3>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Mostrar notificaciones del sistema
                  </label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Recibe notificaciones incluso cuando la aplicación no esté visible
                  </p>
                </div>
                <button
                  onClick={() => handleDesktopNotificationToggle(!settings.desktopNotifications)}
                  disabled={isLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    settings.desktopNotifications 
                      ? 'bg-blue-600' 
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.desktopNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Behavior Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <FiZap className="h-5 w-5 text-blue-600" />
              <span>Comportamiento</span>
            </h3>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Marcar como leído automáticamente
                  </label>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Las notificaciones se marcan como leídas cuando las abres
                  </p>
                </div>
                <button
                  onClick={() => handleSettingChange('autoMarkAsRead', !settings.autoMarkAsRead)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoMarkAsRead 
                      ? 'bg-blue-600' 
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoMarkAsRead ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Default View Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <FiFilter className="h-5 w-5 text-blue-600" />
              <span>Vista Predeterminada</span>
            </h3>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Filtro predeterminado
                </label>
                <select
                  value={settings.defaultFilter}
                  onChange={(e) => handleSettingChange('defaultFilter', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las notificaciones</option>
                  <option value="unread">Sin leer</option>
                  <option value="important">Importantes</option>
                  <option value="today">Hoy</option>
                  <option value="system">Sistema</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Orden predeterminado
                </label>
                <select
                  value={settings.defaultSort}
                  onChange={(e) => handleSettingChange('defaultSort', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguas</option>
                  <option value="priority">Por prioridad</option>
                  <option value="type">Por tipo</option>
                  <option value="unread">Sin leer primero</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            onClick={resetToDefaults}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Restablecer valores predeterminados
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={saveSettings}
              disabled={!hasUnsavedChanges || isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isLoading ? (
                <FiRefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FiSave className="h-4 w-4" />
              )}
              <span>{isLoading ? 'Guardando...' : 'Guardar cambios'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings; 