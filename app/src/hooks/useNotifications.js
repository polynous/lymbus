import { useState, useEffect, useCallback } from 'react';
import notificationApi from '../services/notificationApi';
import { useNotification } from '../components/NotificationSystem';

// Mock notification data for fallback
const mockNotifications = [
  {
    id: 1,
    title: 'Nuevo alumno registrado',
    message: 'Ana González Rivera ha sido registrada en el sistema',
    type: 'success',
    read: false,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    time: 'Hace 5 min'
  },
  {
    id: 2,
    title: 'Recogida completada',
    message: 'Pablo Martínez Fernández ha sido recogido exitosamente',
    type: 'info',
    read: false,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    time: 'Hace 15 min'
  },
  {
    id: 3,
    title: 'Llegada tardía',
    message: 'Emma Rodriguez Silva llegó 10 minutos tarde',
    type: 'warning',
    read: true,
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    time: 'Hace 30 min'
  },
  {
    id: 4,
    title: 'Invitación pendiente',
    message: 'Carmen Lopez Ruiz aún no ha aceptado su invitación',
    type: 'warning',
    read: true,
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    time: 'Hace 1 hora'
  }
];

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const { error: showError, success: showSuccess } = useNotification();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (limit = 50, offset = 0, unreadOnly = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await notificationApi.getNotifications(limit, offset, unreadOnly);
      setNotifications(data);
      setIsUsingMockData(false);
      
      // Also fetch unread count
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Error desconocido';
      setError(errorMessage);
      
      // Fallback to mock data
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
      setIsUsingMockData(true);
      
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('useNotifications: Error fetching notifications:', err);
        console.error('useNotifications: Using mock data fallback');
      }
      
      // Don't show error toast for authentication errors
      if (err.response?.status !== 401) {
        // showError('Error al cargar notificaciones - usando datos de demostración');
        console.log('Using mock notification data');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    try {
      if (isUsingMockData) {
        setUnreadCount(notifications.filter(n => !n.read).length);
        return;
      }
      
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching unread count:', err);
      }
      // Fallback to mock count
      if (notifications.length > 0) {
        setUnreadCount(notifications.filter(n => !n.read).length);
      }
    }
  }, [isUsingMockData, notifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      if (!isUsingMockData) {
        await notificationApi.markAsRead(notificationId);
      }
      
      // Update local state optimistically
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error marking notification as read:', err);
      }
      showError('Error al marcar notificación como leída');
      
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: false }
            : notification
        )
      );
      setUnreadCount(prev => prev + 1);
    }
  }, [isUsingMockData, showError]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      if (!isUsingMockData) {
        const result = await notificationApi.markAllAsRead();
        showSuccess(`Se marcaron ${result.updated_count} notificaciones como leídas`);
      } else {
        const unreadNotifications = notifications.filter(n => !n.read);
        showSuccess(`Se marcaron ${unreadNotifications.length} notificaciones como leídas`);
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error marking all notifications as read:', err);
      }
      showError('Error al marcar todas las notificaciones como leídas');
    }
  }, [isUsingMockData, notifications, showError, showSuccess]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    const deletedNotification = notifications.find(n => n.id === notificationId);
    
    // Optimistically update UI
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    
    // Update unread count if the deleted notification was unread
    if (deletedNotification && !deletedNotification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    try {
      if (!isUsingMockData) {
        await notificationApi.deleteNotification(notificationId);
      }
      showSuccess('Notificación eliminada');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting notification:', err);
      }
      showError('Error al eliminar notificación');
      
      // Revert optimistic update on error
      setNotifications(prev => [...prev, deletedNotification].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ));
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [notifications, isUsingMockData, showError, showSuccess]);

  // Clear all notifications (for local toast notifications)
  const clearAllToasts = useCallback(() => {
    // This would be handled by the NotificationSystem component
    // Just here for completeness
  }, []);

  // Refresh notifications
  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh notifications periodically
  useEffect(() => {
    fetchNotifications();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  // Format notification for display
  const formatNotification = useCallback((notification) => {
    return {
      ...notification,
      time: notification.time || notificationApi.formatTimeAgo(notification.created_at)
    };
  }, []);

  // Get formatted notifications
  const formattedNotifications = notifications.map(formatNotification);

  return {
    notifications: formattedNotifications,
    unreadCount,
    isLoading,
    error: isUsingMockData ? null : error, // Don't show error if using mock data
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    clearAllToasts,
    isUsingMockData
  };
}; 