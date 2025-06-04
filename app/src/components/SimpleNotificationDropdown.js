import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { 
  FiBell, 
  FiCheck, 
  FiTrash2, 
  FiExternalLink, 
  FiRefreshCw, 
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiX
} from 'react-icons/fi';
import { useNotifications } from '../hooks/useNotifications';
import { useNotification } from './NotificationSystem';

const SimpleNotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  
  const {
    notifications = [],
    unreadCount = 0,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  } = useNotifications();

  const { success, error: showError } = useNotification();

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const top = rect.bottom + 8;
    const right = window.innerWidth - rect.right;
    
    setDropdownPosition({ top, right });
  };

  // Handle outside clicks with better timing and activity detector compatibility
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Double-check that refs are still valid
      if (!dropdownRef.current || !buttonRef.current) return;
      
      // Check if the click is inside the dropdown or button
      const isInsideDropdown = dropdownRef.current.contains(event.target);
      const isInsideButton = buttonRef.current.contains(event.target);
      
      console.log('SimpleNotificationDropdown: Click detected', {
        isInsideDropdown,
        isInsideButton,
        target: event.target
      });
      
      if (!isInsideDropdown && !isInsideButton) {
        console.log('SimpleNotificationDropdown: Outside click, closing dropdown');
        // Use setTimeout to ensure this runs after the activity detector
        setTimeout(() => {
          setIsOpen(false);
        }, 0);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        console.log('SimpleNotificationDropdown: Escape pressed, closing dropdown');
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
      }
    };

    // Use bubble phase (not capture) to ensure we run after the activity detector
    console.log('SimpleNotificationDropdown: Adding event listeners');
    document.addEventListener('mousedown', handleClickOutside, false);
    document.addEventListener('keydown', handleEscape, false);

    return () => {
      console.log('SimpleNotificationDropdown: Removing event listeners');
      document.removeEventListener('mousedown', handleClickOutside, false);
      document.removeEventListener('keydown', handleEscape, false);
    };
  }, [isOpen]);

  // Update position when opened
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      const handleResize = () => updateDropdownPosition();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen]);

  const handleBellClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('SimpleNotificationDropdown: Bell clicked, current isOpen:', isOpen);
    
    // Toggle state immediately without requestAnimationFrame
    setIsOpen(prev => {
      console.log('SimpleNotificationDropdown: Toggling from', prev, 'to', !prev);
      return !prev;
    });
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await markAsRead?.(notificationId);
    } catch (error) {
      showError('Error marking notification as read');
    }
  };

  const handleDelete = async (notificationId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await deleteNotification?.(notificationId);
    } catch (error) {
      showError('Error deleting notification');
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await markAllAsRead?.();
    } catch (error) {
      showError('Error marking all notifications as read');
    }
  };

  const getNotificationIcon = (type) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (type) {
      case 'success':
        return <FiCheckCircle {...iconProps} className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <FiAlertTriangle {...iconProps} className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <FiAlertCircle {...iconProps} className="h-4 w-4 text-red-500" />;
      case 'info':
        return <FiInfo {...iconProps} className="h-4 w-4 text-blue-500" />;
      default:
        return <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const NotificationBell = () => (
    <button
      ref={buttonRef}
      onClick={handleBellClick}
      className="relative p-2.5 rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all duration-200 group"
      aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
    >
      <FiBell className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </button>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
        <FiBell className="h-8 w-8 text-blue-500 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        ¡Todo al día!
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
        No hay notificaciones nuevas en este momento.
      </p>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-8">
      <FiRefreshCw className="h-6 w-6 text-blue-500 animate-spin mb-3" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Cargando notificaciones...</p>
    </div>
  );

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-8 px-6">
      <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-3">
        <FiAlertCircle className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm text-red-600 dark:text-red-400 text-center mb-3">
        Error al cargar las notificaciones
      </p>
      <button
        onClick={refresh}
        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  );

  const DropdownContent = () => (
    <div
      ref={dropdownRef}
      className="fixed w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 max-h-[32rem] overflow-hidden z-50 animate-slide-in-from-top"
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
      }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 border-b border-slate-200/50 dark:border-slate-700/50 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                {unreadCount} nuevas
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200 disabled:opacity-50"
              title="Actualizar notificaciones"
            >
              <FiRefreshCw className={`h-4 w-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200"
              title="Cerrar"
            >
              <FiX className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        {error ? (
          <ErrorState />
        ) : isLoading ? (
          <LoadingState />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 ${
                  !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-2">
                        <p className={`text-sm font-medium ${
                          !notification.read 
                            ? 'text-slate-900 dark:text-slate-100' 
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <div className="flex items-center mt-2 text-xs text-slate-400">
                          <FiClock className="h-3 w-3 mr-1" />
                          <span>{notification.time || formatTimeAgo(notification.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {!notification.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors duration-200"
                            title="Marcar como leída"
                          >
                            <FiCheck className="h-3 w-3 text-emerald-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
                          title="Eliminar"
                        >
                          <FiTrash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors duration-200"
              >
                Marcar todas como leídas
              </button>
            )}
            <Link
              to="/app/notificaciones"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 flex items-center space-x-1"
              onClick={() => setIsOpen(false)}
            >
              <span>Ver todas</span>
              <FiExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <NotificationBell />
      {isOpen && createPortal(<DropdownContent />, document.body)}
    </>
  );
};

export default SimpleNotificationDropdown; 