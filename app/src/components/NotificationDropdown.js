import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { 
  FiBell, 
  FiCheck, 
  FiTrash2, 
  FiExternalLink, 
  FiRefreshCw, 
  FiClock
} from 'react-icons/fi';
import { useNotifications } from '../hooks/useNotifications';

const NotificationDropdown = () => {
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

  // Calculate dropdown position once when opened
  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const top = rect.bottom + 8;
    const right = window.innerWidth - rect.right;
    
    setDropdownPosition({ top, right });
  };

  // Handle outside clicks
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Update position only when opened, not during scroll
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      // Only listen to window resize, not scroll to prevent jittering
      const handleResize = () => updateDropdownPosition();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen]);

  const handleBellClick = (e) => {
    // Don't prevent default for the main button click, just stop propagation to prevent bubbling
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await markAsRead?.(notificationId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (notificationId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await deleteNotification?.(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      await markAllAsRead?.();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'warning':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
    }
  };

  const NotificationBell = () => (
    <button
      ref={buttonRef}
      onClick={handleBellClick}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <FiBell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );

  const DropdownContent = () => (
    <div
      ref={dropdownRef}
      className="notification-dropdown w-96 rounded-lg max-h-96 overflow-hidden"
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Notificaciones
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <FiRefreshCw className={`h-4 w-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-64 overflow-y-auto scrollbar-thin">
        {error ? (
          <div className="p-4 text-center text-red-600 dark:text-red-400">
            <p className="text-sm">Error al cargar las notificaciones</p>
            <button
              onClick={refresh}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-4 text-center">
            <FiRefreshCw className="h-6 w-6 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-gray-500">Cargando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <FiBell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Sin notificaciones
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((notification, index) => {
              const isFirst = index === 0;
              const isLast = index === notifications.length - 1;
              const isSingle = notifications.length === 1;
              
              let roundedClass = '';
              if (isSingle) {
                roundedClass = 'list-item-single';
              } else if (isFirst) {
                roundedClass = 'list-item-first';
              } else if (isLast) {
                roundedClass = 'list-item-last';
              } else {
                roundedClass = 'list-item-middle';
              }
              
              return (
                <div
                  key={notification.id}
                  className={`group p-4 list-item-hover ${roundedClass} ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-2">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            !notification.read 
                              ? 'text-gray-900 dark:text-gray-100' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-gray-400">
                            <FiClock className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{notification.time || 'Ahora mismo'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                              title="Marcar como leída"
                            >
                              <FiCheck className="h-3 w-3 text-green-600" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title="Eliminar"
                          >
                            <FiTrash2 className="h-3 w-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 transition-colors font-medium"
              >
                Marcar todas como leídas
              </button>
            )}
            <Link
              to="/app/notificaciones"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors flex items-center space-x-1"
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

export default NotificationDropdown; 