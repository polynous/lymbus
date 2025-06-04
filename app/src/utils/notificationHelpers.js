import notificationApi from '../services/notificationApi';

/**
 * Utility functions to create system notifications for common events
 */

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Notification categories
export const NOTIFICATION_CATEGORIES = {
  SYSTEM: 'system',
  USER: 'user',
  SECURITY: 'security',
  UPDATE: 'update',
  REMINDER: 'reminder',
  SOCIAL: 'social'
};

// Sound effects for notifications
export const playNotificationSound = (type = 'info') => {
  // Only play sounds if user hasn't disabled them
  const soundEnabled = localStorage.getItem('notificationSounds') !== 'false';
  if (!soundEnabled) return;

  try {
    // Create audio context if needed
    const audioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioContext) return;

    const ctx = new audioContext();
    
    // Different frequencies for different notification types
    const frequencies = {
      success: [523.25, 659.25, 783.99], // C5, E5, G5 (major chord)
      error: [220, 277.18], // A3, C#4 (dissonant)
      warning: [440, 554.37], // A4, C#5
      info: [523.25, 698.46] // C5, F5
    };

    const noteFreqs = frequencies[type] || frequencies.info;
    
    // Play a sequence of notes
    noteFreqs.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      oscillator.type = 'sine';
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      const startTime = ctx.currentTime + (index * 0.1);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  } catch (error) {
    console.log('Sound notification not supported:', error);
  }
};

// Format notification time with enhanced relative time
export const formatNotificationTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 30) return 'Ahora mismo';
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}sem`;
  
  // For older notifications, show actual date
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short',
    year: diffInDays > 365 ? 'numeric' : undefined
  });
};

// Enhanced notification priority detection
export const getNotificationPriority = (notification) => {
  // Check explicit priority first
  if (notification.priority) return notification.priority;
  
  // Infer from type and content
  if (notification.type === 'error') return NOTIFICATION_PRIORITIES.HIGH;
  if (notification.type === 'warning') return NOTIFICATION_PRIORITIES.MEDIUM;
  if (notification.type === 'success') return NOTIFICATION_PRIORITIES.LOW;
  
  // Check for urgent keywords
  const urgentKeywords = ['urgente', 'crítico', 'inmediato', 'importante'];
  const messageText = (notification.title + ' ' + notification.message).toLowerCase();
  const hasUrgentKeywords = urgentKeywords.some(keyword => messageText.includes(keyword));
  
  if (hasUrgentKeywords) return NOTIFICATION_PRIORITIES.HIGH;
  
  return NOTIFICATION_PRIORITIES.NORMAL;
};

// Group notifications by various criteria
export const groupNotifications = (notifications, groupBy = 'date') => {
  const groups = {};
  
  notifications.forEach(notification => {
    let groupKey;
    
    switch (groupBy) {
      case 'date':
        groupKey = getDateGroup(notification.created_at);
        break;
      case 'type':
        groupKey = notification.type;
        break;
      case 'category':
        groupKey = notification.category || 'general';
        break;
      case 'priority':
        groupKey = getNotificationPriority(notification);
        break;
      default:
        groupKey = 'all';
    }
    
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(notification);
  });
  
  return groups;
};

// Get date group for notification
const getDateGroup = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 24) return 'today';
  if (diffInHours < 48) return 'yesterday';
  if (diffInHours < 168) return 'thisWeek'; // 7 days
  if (diffInHours < 720) return 'thisMonth'; // 30 days
  return 'older';
};

// Filter notifications with advanced criteria
export const filterNotifications = (notifications, filters = {}) => {
  const {
    search,
    type,
    category,
    priority,
    read,
    dateRange,
    important
  } = filters;
  
  return notifications.filter(notification => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        notification.title?.toLowerCase().includes(searchLower) ||
        notification.message?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (type && type !== 'all' && notification.type !== type) return false;
    
    // Category filter
    if (category && category !== 'all' && notification.category !== category) return false;
    
    // Priority filter
    if (priority && priority !== 'all') {
      const notificationPriority = getNotificationPriority(notification);
      if (notificationPriority !== priority) return false;
    }
    
    // Read status filter
    if (read !== undefined && notification.read !== read) return false;
    
    // Important filter (high priority or error/warning types)
    if (important) {
      const isImportant = 
        ['error', 'warning'].includes(notification.type) ||
        getNotificationPriority(notification) === NOTIFICATION_PRIORITIES.HIGH;
      if (!isImportant) return false;
    }
    
    // Date range filter
    if (dateRange) {
      const notificationDate = new Date(notification.created_at);
      const { start, end } = dateRange;
      if (start && notificationDate < new Date(start)) return false;
      if (end && notificationDate > new Date(end)) return false;
    }
    
    return true;
  });
};

// Sort notifications with multiple criteria
export const sortNotifications = (notifications, sortBy = 'newest') => {
  const sorted = [...notifications];
  
  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      
      case 'priority':
        const priorityOrder = { 
          [NOTIFICATION_PRIORITIES.HIGH]: 4, 
          [NOTIFICATION_PRIORITIES.MEDIUM]: 3, 
          [NOTIFICATION_PRIORITIES.NORMAL]: 2, 
          [NOTIFICATION_PRIORITIES.LOW]: 1 
        };
        const aPriority = priorityOrder[getNotificationPriority(a)] || 0;
        const bPriority = priorityOrder[getNotificationPriority(b)] || 0;
        
        // If priorities are equal, sort by date (newest first)
        if (aPriority === bPriority) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return bPriority - aPriority;
      
      case 'type':
        const typeOrder = { error: 4, warning: 3, info: 2, success: 1 };
        const aTypeOrder = typeOrder[a.type] || 0;
        const bTypeOrder = typeOrder[b.type] || 0;
        
        if (aTypeOrder === bTypeOrder) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return bTypeOrder - aTypeOrder;
      
      case 'alphabetical':
        const aTitle = a.title?.toLowerCase() || '';
        const bTitle = b.title?.toLowerCase() || '';
        return aTitle.localeCompare(bTitle);
      
      case 'unread':
        // Unread first, then by date
        if (a.read !== b.read) {
          return a.read ? 1 : -1;
        }
        return new Date(b.created_at) - new Date(a.created_at);
      
      case 'newest':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });
  
  return sorted;
};

// Generate notification summary text
export const generateNotificationSummary = (notifications) => {
  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;
  
  if (totalCount === 0) return 'No hay notificaciones';
  if (unreadCount === 0) return `${totalCount} notificaciones, todas leídas`;
  if (unreadCount === totalCount) return `${totalCount} notificaciones sin leer`;
  
  return `${totalCount} notificaciones, ${unreadCount} sin leer`;
};

// Check if notification should be shown as important
export const isImportantNotification = (notification) => {
  const priority = getNotificationPriority(notification);
  return priority === NOTIFICATION_PRIORITIES.HIGH || 
         ['error', 'warning'].includes(notification.type);
};

// Get notification icon based on type and priority
export const getNotificationIcon = (type, priority) => {
  const iconMap = {
    success: 'CheckCircle',
    error: 'AlertCircle',
    warning: 'AlertTriangle',
    info: 'Info'
  };
  
  return iconMap[type] || 'Bell';
};

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Local storage helpers for notification preferences
export const NotificationPreferences = {
  getSoundEnabled: () => localStorage.getItem('notificationSounds') !== 'false',
  setSoundEnabled: (enabled) => localStorage.setItem('notificationSounds', enabled.toString()),
  
  getAutoMarkAsRead: () => localStorage.getItem('autoMarkAsRead') === 'true',
  setAutoMarkAsRead: (enabled) => localStorage.setItem('autoMarkAsRead', enabled.toString()),
  
  getDesktopNotifications: () => localStorage.getItem('desktopNotifications') === 'true',
  setDesktopNotifications: (enabled) => localStorage.setItem('desktopNotifications', enabled.toString()),
  
  getNotificationFilter: () => localStorage.getItem('notificationFilter') || 'all',
  setNotificationFilter: (filter) => localStorage.setItem('notificationFilter', filter),
  
  getNotificationSort: () => localStorage.getItem('notificationSort') || 'newest',
  setNotificationSort: (sort) => localStorage.setItem('notificationSort', sort)
};

// Desktop notification API wrapper
export const showDesktopNotification = (notification) => {
  if (!NotificationPreferences.getDesktopNotifications()) return;
  
  if ('Notification' in window && Notification.permission === 'granted') {
    const desktopNotif = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: `notification-${notification.id}`,
      requireInteraction: isImportantNotification(notification)
    });
    
    // Auto close after 5 seconds for non-important notifications
    if (!isImportantNotification(notification)) {
      setTimeout(() => desktopNotif.close(), 5000);
    }
    
    return desktopNotif;
  }
};

// Request desktop notification permission
export const requestDesktopNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    NotificationPreferences.setDesktopNotifications(permission === 'granted');
    return permission === 'granted';
  }
  return false;
};

// Common notification creators
export const createNotifications = {
  // Student entry notifications
  studentEntry: async (studentName, time) => {
    const title = 'Entrada registrada';
    const message = `${studentName} ha llegado a la escuela a las ${time}`;
    return { title, message, type: NOTIFICATION_TYPES.SUCCESS };
  },

  // Student checkout notifications  
  studentCheckout: async (studentName, time, parentName) => {
    const title = 'Salida registrada';
    const message = parentName 
      ? `${studentName} ha sido recogido por ${parentName} a las ${time}`
      : `${studentName} ha salido de la escuela a las ${time}`;
    return { title, message, type: NOTIFICATION_TYPES.INFO };
  },

  // QR code generation
  qrCodeGenerated: async (studentName) => {
    const title = 'Código QR generado';
    const message = `Se ha generado un nuevo código QR para recoger a ${studentName}`;
    return { title, message, type: NOTIFICATION_TYPES.INFO };
  },

  // Late arrival notifications
  lateArrival: async (studentName, time) => {
    const title = 'Llegada tardía';
    const message = `${studentName} ha llegado tarde a las ${time}`;
    return { title, message, type: NOTIFICATION_TYPES.WARNING };
  },

  // Emergency notifications
  emergency: async (message) => {
    const title = 'Alerta de emergencia';
    return { title, message, type: NOTIFICATION_TYPES.ERROR };
  },

  // System updates
  systemUpdate: async (feature) => {
    const title = 'Sistema actualizado';
    const message = feature 
      ? `El sistema ha sido actualizado con: ${feature}`
      : 'El sistema Lymbus ha sido actualizado con nuevas funcionalidades';
    return { title, message, type: NOTIFICATION_TYPES.INFO };
  },

  // User invitations
  userInvited: async (email, role) => {
    const title = 'Usuario invitado';
    const message = `Se ha enviado una invitación a ${email} como ${role}`;
    return { title, message, type: NOTIFICATION_TYPES.SUCCESS };
  },

  // Connection issues
  connectionIssue: async () => {
    const title = 'Problema de conexión';
    const message = 'Se detectó un problema temporal de conectividad';
    return { title, message, type: NOTIFICATION_TYPES.WARNING };
  },

  // Reminders
  reminder: async (message) => {
    const title = 'Recordatorio';
    return { title, message, type: NOTIFICATION_TYPES.INFO };
  },

  // Security alerts
  securityAlert: async (message) => {
    const title = 'Alerta de seguridad';
    return { title, message, type: NOTIFICATION_TYPES.ERROR };
  }
};

/**
 * Helper function to send a notification (for staff/admin only)
 * This would be used when the user has permission to create notifications
 */
export const sendNotification = async (userId, notificationData) => {
  try {
    // This would require admin privileges in the backend
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('lymbus_token')}`
      },
      body: JSON.stringify({
        ...notificationData,
        user_id: userId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Helper to create notifications for multiple users (broadcast)
 */
export const broadcastNotification = async (userIds, notificationData) => {
  try {
    const promises = userIds.map(userId => sendNotification(userId, notificationData));
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    throw error;
  }
};

/**
 * Get all staff users (for broadcasting important notifications)
 */
export const getStaffUsers = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/auth/users?user_type=staff`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('lymbus_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch staff users');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching staff users:', error);
    return [];
  }
}; 