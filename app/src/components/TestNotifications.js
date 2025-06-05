import React from 'react';
import { FiCheck, FiAlertTriangle, FiInfo, FiZap, FiTestTube } from 'react-icons/fi';
import { useNotification } from './NotificationSystem';
import { useAuth } from '../hooks/useAuth';
import axiosClient from '../utils/axiosConfig';

const TestNotifications = () => {
  const { success, error, warning, info } = useNotification();
  const { user } = useAuth();

  const createSystemNotification = async () => {
    try {
      await axiosClient.post('/notifications', {
        title: 'Notificación de prueba',
        message: 'Esta es una notificación de prueba creada desde la configuración del sistema.',
        type: 'info',
        user_id: user.id
      });
      success('Notificación del sistema creada correctamente');
    } catch (err) {
      console.error('Error creating system notification:', err);
      error('Error al crear la notificación del sistema');
    }
  };

  return (
    <div className="border-t border-white/10 dark:border-slate-700/30 pt-6">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center space-x-2">
        <FiTestTube className="h-5 w-5" />
        <span>Probar Notificaciones</span>
      </h3>
      <p className="text-sm text-secondary mb-4">
        Prueba diferentes tipos de notificaciones para verificar que el sistema funcione correctamente.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => success('¡Prueba exitosa!', { title: 'Notificación de éxito' })}
          className="flex flex-col items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
        >
          <FiCheck className="h-6 w-6 text-emerald-600 mb-2" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Éxito</span>
        </button>
        
        <button
          onClick={() => error('Error de prueba', { title: 'Notificación de error' })}
          className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <FiAlertTriangle className="h-6 w-6 text-red-600 mb-2" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">Error</span>
        </button>
        
        <button
          onClick={() => warning('Advertencia de prueba', { title: 'Notificación de advertencia' })}
          className="flex flex-col items-center justify-center p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          <FiAlertTriangle className="h-6 w-6 text-amber-600 mb-2" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Advertencia</span>
        </button>
        
        <button
          onClick={() => info('Información de prueba', { title: 'Notificación informativa' })}
          className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <FiInfo className="h-6 w-6 text-blue-600 mb-2" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Info</span>
        </button>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <FiZap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
              Crear notificación de sistema
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Estas notificaciones aparecerán en el dropdown del sistema y en la página de notificaciones.
            </p>
            <button
              onClick={createSystemNotification}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <FiZap className="h-3 w-3 mr-1" />
              Crear Notificación de Sistema
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNotifications; 