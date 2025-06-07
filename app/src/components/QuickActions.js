import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiZap, 
  FiLogIn, 
  FiTruck, 
  FiUsers, 
  FiHash, 
  FiX,
  FiClock,
  FiSettings,
  FiSearch,
  FiPlus,
  FiRefreshCw
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from './NotificationSystem';

const QuickActions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { success, info } = useNotification();
  const [isOpen, setIsOpen] = useState(false);

  // Only show for staff users
  if (user?.user_type !== 'staff') {
    return null;
  }

  // Define context-aware actions based on current page
  const getContextualActions = () => {
    const pathname = location.pathname;
    
    if (pathname.includes('/entrada')) {
      return [
        {
          icon: <FiHash className="h-4 w-4" />,
          label: 'Escáner QR',
          description: 'Registrar entradas masivas',
          action: () => {
            // Trigger QR scanner (this would need to be implemented in StudentEntry)
            window.dispatchEvent(new CustomEvent('openQRScanner'));
            success('Abriendo escáner QR...');
          }
        },
        {
          icon: <FiRefreshCw className="h-4 w-4" />,
          label: 'Actualizar Lista',
          description: 'Recargar alumnos',
          action: () => {
            window.location.reload();
          }
        },
        {
          icon: <FiTruck className="h-4 w-4" />,
          label: 'Ir a Recogida',
          description: 'Cambiar a coordinación',
          action: () => {
            navigate('/app/recogida');
          }
        }
      ];
    }
    
    if (pathname.includes('/recogida')) {
      return [
        {
          icon: <FiUsers className="h-4 w-4" />,
          label: 'Vista Maestros',
          description: 'Cambiar a vista de grupos',
          action: () => {
            navigate('/app/maestros');
          }
        },
        {
          icon: <FiLogIn className="h-4 w-4" />,
          label: 'Ir a Entradas',
          description: 'Registrar llegadas',
          action: () => {
            navigate('/app/entrada');
          }
        },
        {
          icon: <FiRefreshCw className="h-4 w-4" />,
          label: 'Actualizar Cola',
          description: 'Recargar solicitudes',
          action: () => {
            window.location.reload();
          }
        }
      ];
    }
    
    if (pathname.includes('/maestros')) {
      return [
        {
          icon: <FiTruck className="h-4 w-4" />,
          label: 'Coordinación Staff',
          description: 'Vista de coordinación',
          action: () => {
            navigate('/app/recogida');
          }
        },
        {
          icon: <FiRefreshCw className="h-4 w-4" />,
          label: 'Actualizar Grupo',
          description: 'Recargar solicitudes',
          action: () => {
            window.location.reload();
          }
        }
      ];
    }
    
    // Default actions for dashboard and other pages
    return [
      {
        icon: <FiLogIn className="h-4 w-4" />,
        label: 'Entrada alumnos',
        description: 'Registrar llegadas',
        action: () => {
          navigate('/app/entrada');
        }
      },
      {
        icon: <FiTruck className="h-4 w-4" />,
        label: 'Coordinación Recogida',
        description: 'Gestionar salidas',
        action: () => {
          navigate('/app/recogida');
        }
      },
      {
        icon: <FiClock className="h-4 w-4" />,
        label: 'Ver Asistencia',
        description: 'Reportes y estadísticas',
        action: () => {
          navigate('/app/asistencia');
        }
      }
    ];
  };

  const actions = getContextualActions();

  const handleActionClick = (action) => {
    action.action();
    setIsOpen(false);
  };

  return (
    <>
      {/* Main Quick Actions Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 ${
            isOpen ? 'rotate-45' : ''
          }`}
          title="Acciones Rápidas"
        >
          {isOpen ? (
            <FiX className="h-6 w-6" />
          ) : (
            <FiZap className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Actions Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Actions Panel */}
          <div className="fixed bottom-24 right-6 z-40 w-80 max-w-[calc(100vw-3rem)]">
            <div className="glass-card p-4 animate-slide-in-right">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary flex items-center space-x-2">
                  <FiZap className="h-5 w-5" />
                  <span>Acciones Rápidas</span>
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleActionClick(action)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 text-left group"
                  >
                    <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors duration-200">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary">
                        {action.label}
                      </p>
                      <p className="text-xs text-secondary">
                        {action.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Context Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-muted text-center">
                  Acciones disponibles para: <span className="font-medium">{getPageName()}</span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

  function getPageName() {
    const pathname = location.pathname;
    if (pathname.includes('/entrada')) return 'Entrada de alumnos';
    if (pathname.includes('/recogida')) return 'Coordinación de Recogida';
    if (pathname.includes('/maestros')) return 'Vista de Maestros';
    return 'Panel Principal';
  }
};

export default QuickActions; 