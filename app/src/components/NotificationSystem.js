import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiAlertTriangle, 
  FiInfo, 
  FiX,
  FiZap
} from 'react-icons/fi';
import { playNotificationSound } from '../utils/notificationHelpers';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const NotificationItem = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleRemove = useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  }, [notification.id, onRemove]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <FiCheckCircle className="h-6 w-6" />;
      case 'error':
        return <FiAlertCircle className="h-6 w-6" />;
      case 'warning':
        return <FiAlertTriangle className="h-6 w-6" />;
      case 'info':
        return <FiInfo className="h-6 w-6" />;
      default:
        return <FiZap className="h-6 w-6" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "glass-card p-4 mb-3 flex items-start space-x-3 shadow-xl border-l-4 transform transition-all duration-300 max-w-md w-full";
    
    switch (notification.type) {
      case 'success':
        return `${baseStyles} border-l-emerald-500 bg-emerald-50/90 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200`;
      case 'error':
        return `${baseStyles} border-l-red-500 bg-red-50/90 dark:bg-red-900/30 text-red-800 dark:text-red-200`;
      case 'warning':
        return `${baseStyles} border-l-amber-500 bg-amber-50/90 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200`;
      case 'info':
        return `${baseStyles} border-l-blue-500 bg-blue-50/90 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200`;
      default:
        return `${baseStyles} border-l-slate-500 bg-slate-50/90 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200`;
    }
  };

  return (
    <div
      className={`${getStyles()} ${
        isVisible && !isRemoving
          ? 'translate-x-0 opacity-100 scale-100'
          : isRemoving
          ? 'translate-x-full opacity-0 scale-95'
          : 'translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className="flex-shrink-0 pt-0.5">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        {notification.title && (
          <h4 className="text-sm font-semibold mb-1">
            {notification.title}
          </h4>
        )}
        <p className="text-sm opacity-90">
          {notification.message}
        </p>
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="mt-2 text-xs font-medium underline hover:no-underline transition-all duration-200"
          >
            {notification.action.label}
          </button>
        )}
      </div>
      
      <button
        onClick={handleRemove}
        className="flex-shrink-0 ml-4 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200"
        aria-label="Cerrar notificación"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
};

const NotificationContainer = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>,
    document.body
  );
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const recentNotificationsRef = useRef(new Set());

  const addNotification = useCallback((notification) => {
    // Create a unique key for deduplication
    const notificationKey = `${notification.type}-${notification.message}`;
    
    // Check if we've recently added this exact notification
    if (recentNotificationsRef.current.has(notificationKey)) {
      return null; // Don't add duplicate
    }
    
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      duration: 5000, // Default 5 seconds
      ...notification,
    };

    // Add to recent notifications set
    recentNotificationsRef.current.add(notificationKey);
    
    // Remove from recent set after 200ms to allow legitimate duplicates later
    setTimeout(() => {
      recentNotificationsRef.current.delete(notificationKey);
    }, 200);

    setNotifications(prev => [...prev, newNotification]);

    // Play sound effect based on type
    if (notification.sound !== false) {
      playNotificationSound(notification.type);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      ...options,
    });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      duration: 8000, // Errors stay longer
      ...options,
    });
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      duration: 6000,
      ...options,
    });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      ...options,
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 