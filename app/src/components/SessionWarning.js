import React, { useState, useEffect } from 'react';
import { FiClock, FiRefreshCw } from 'react-icons/fi';
import { useNotification } from './NotificationSystem';

const SessionWarning = ({ timeUntilTimeout, resetActivity, isActive }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [warningShown, setWarningShown] = useState(false);
  const { warning } = useNotification();

  // Show warning 5 minutes before timeout
  const warningThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds

  useEffect(() => {
    if (timeUntilTimeout <= warningThreshold && timeUntilTimeout > 0 && !warningShown && isActive) {
      setShowWarning(true);
      setWarningShown(true);
      warning(
        `Tu sesión expirará en ${Math.ceil(timeUntilTimeout / 60000)} minutos. Haz clic en cualquier lugar para mantener la sesión activa.`,
        {
          duration: 10000,
          action: {
            label: 'Mantener sesión',
            onClick: () => {
              resetActivity();
              setShowWarning(false);
              setWarningShown(false);
            }
          }
        }
      );
    }

    // Reset warning when activity is detected
    if (timeUntilTimeout > warningThreshold) {
      setWarningShown(false);
      setShowWarning(false);
    }
  }, [timeUntilTimeout, warningShown, isActive, warning, resetActivity]);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="glass-card p-4 border-l-4 border-l-warning-500">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <FiClock className="h-5 w-5 text-warning-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Sesión por expirar
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Tu sesión expirará en {Math.ceil(timeUntilTimeout / 60000)} minutos.
            </p>
            <button
              onClick={() => {
                resetActivity();
                setShowWarning(false);
                setWarningShown(false);
              }}
              className="mt-2 btn-secondary flex items-center space-x-2 text-xs"
            >
              <FiRefreshCw className="h-3 w-3" />
              <span>Extender sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionWarning; 