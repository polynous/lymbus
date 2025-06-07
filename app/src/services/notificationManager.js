import simpleWebSocketService from './simpleWebSocket';
import { showDesktopNotification, requestDesktopNotificationPermission } from '../utils/notificationHelpers';

class NotificationManager {
  constructor() {
    this.uiNotificationSystem = null;
    this.isInitialized = false;
    this.permissionsGranted = {
      desktop: false,
      push: false
    };
    this.serviceWorkerRegistration = null;
    this.subscriptions = new Set();
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔔 Initializing Notification Manager...');
    
    try {
      // 1. Request permissions
      await this.requestPermissions();
      
      // 2. Register service worker
      await this.registerServiceWorker();
      
      // 3. Setup WebSocket listener
      this.setupWebSocketListener();
      
      // 4. Setup visibility change listener
      this.setupVisibilityListener();
      
      this.isInitialized = true;
      console.log('✅ Notification Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Notification Manager:', error);
    }
  }

  async requestPermissions() {
    console.log('📋 Requesting notification permissions...');
    
    // Request desktop notification permission
    try {
      this.permissionsGranted.desktop = await requestDesktopNotificationPermission();
      console.log(`Desktop notifications: ${this.permissionsGranted.desktop ? '✅' : '❌'}`);
    } catch (error) {
      console.warn('Desktop notification permission failed:', error);
    }

    // Request push notification permission (if service worker available)
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const permission = await Notification.requestPermission();
        this.permissionsGranted.push = permission === 'granted';
        console.log(`Push notifications: ${this.permissionsGranted.push ? '✅' : '❌'}`);
      } catch (error) {
        console.warn('Push notification permission failed:', error);
      }
    }
  }

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      this.serviceWorkerRegistration = registration;
      console.log('✅ Service Worker registered successfully');

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found');
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  setupWebSocketListener() {
    // Listen for real-time notifications
    const originalHandleMessage = simpleWebSocketService.handleMessage;
    
    simpleWebSocketService.handleMessage = (data) => {
      // Call original handler first
      originalHandleMessage.call(simpleWebSocketService, data);
      
      // Handle notifications specifically
      if (data.type === 'notification') {
        this.handleRealtimeNotification(data.data);
      }
    };

    // Ensure WebSocket is connected
    if (!simpleWebSocketService.isConnected()) {
      simpleWebSocketService.connect();
    }
  }

  setupVisibilityListener() {
    // Handle page visibility changes for notification behavior
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden - enable desktop notifications
        console.log('👁️ Page hidden - enabling desktop notifications');
      } else {
        // Page is visible - focus on UI notifications
        console.log('👁️ Page visible - focusing on UI notifications');
      }
    });
  }

  handleRealtimeNotification(notificationData) {
    console.log('📨 Received real-time notification:', notificationData);

    // 1. Show UI notification if page is visible
    if (!document.hidden && this.uiNotificationSystem) {
      this.showUINotification(notificationData);
    }

    // 2. Show desktop notification if page is hidden or permission granted
    if ((document.hidden || this.permissionsGranted.desktop) && this.permissionsGranted.desktop) {
      this.showDesktopNotification(notificationData);
    }

    // 3. Update badge count
    this.updateBadgeCount();

    // 4. Store notification for offline access
    this.storeNotificationOffline(notificationData);
  }

  showUINotification(notificationData) {
    if (!this.uiNotificationSystem) {
      console.warn('UI Notification system not connected');
      return;
    }

    try {
      const { title, message, type } = notificationData;
      
      // Use the connected UI notification system
      this.uiNotificationSystem.addNotification({
        title,
        message,
        type,
        duration: this.getNotificationDuration(type),
        action: this.getNotificationAction(notificationData)
      });
    } catch (error) {
      console.error('Failed to show UI notification:', error);
    }
  }

  showDesktopNotification(notificationData) {
    if (!this.permissionsGranted.desktop) {
      return;
    }

    try {
      showDesktopNotification({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        onClick: () => {
          // Focus the window when desktop notification is clicked
          window.focus();
          
          // Navigate to notifications page or relevant section
          if (window.location.pathname !== '/notifications') {
            window.location.hash = '#/notifications';
          }
        }
      });
    } catch (error) {
      console.error('Failed to show desktop notification:', error);
    }
  }

  async updateBadgeCount() {
    if (!this.serviceWorkerRegistration) return;

    try {
      // Get unread count from API or local storage
      const unreadCount = await this.getUnreadCount();
      
      // Update browser badge
      if ('setBadge' in navigator) {
        await navigator.setBadge(unreadCount);
      }

      // Update service worker
      if (this.serviceWorkerRegistration.active) {
        this.serviceWorkerRegistration.active.postMessage({
          type: 'UPDATE_BADGE',
          count: unreadCount
        });
      }
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  async getUnreadCount() {
    try {
      // Try to get from API first
      const response = await fetch('/api/notifications/unread/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.unread_count || 0;
      }
    } catch (error) {
      console.warn('Failed to fetch unread count from API:', error);
    }

    // Fallback to local storage count
    const stored = localStorage.getItem('lymbus_unread_notifications');
    return stored ? parseInt(stored, 10) : 0;
  }

  storeNotificationOffline(notificationData) {
    try {
      // Store in localStorage for offline access
      const stored = JSON.parse(localStorage.getItem('lymbus_offline_notifications') || '[]');
      stored.unshift({
        ...notificationData,
        timestamp: Date.now(),
        offline: true
      });
      
      // Keep only last 50 notifications
      stored.splice(50);
      
      localStorage.setItem('lymbus_offline_notifications', JSON.stringify(stored));
    } catch (error) {
      console.error('Failed to store notification offline:', error);
    }
  }

  getNotificationDuration(type) {
    switch (type) {
      case 'error':
        return 10000; // 10 seconds for errors
      case 'warning':
        return 7000;  // 7 seconds for warnings
      case 'success':
        return 5000;  // 5 seconds for success
      default:
        return 6000;  // 6 seconds for info
    }
  }

  getNotificationAction(notificationData) {
    // Return appropriate action based on notification type
    if (notificationData.type === 'student_entry' || notificationData.type === 'student_exit') {
      return {
        label: 'Ver detalles',
        onClick: () => {
          window.location.hash = '#/dashboard';
        }
      };
    }
    
    return null;
  }

  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'NOTIFICATION_CLICK':
        // Handle notification click from service worker
        this.handleNotificationClick(data);
        break;
      case 'BACKGROUND_SYNC':
        // Handle background sync
        this.handleBackgroundSync(data);
        break;
      default:
        console.log('Unknown service worker message:', event.data);
    }
  }

  handleNotificationClick(notificationData) {
    console.log('Notification clicked:', notificationData);
    
    // Focus window
    if (window.focus) window.focus();
    
    // Navigate to relevant page
    switch (notificationData.type) {
      case 'student_entry':
      case 'student_exit':
        window.location.hash = '#/dashboard';
        break;
      default:
        window.location.hash = '#/notifications';
    }
  }

  // Public methods
  connectUISystem(uiNotificationSystem) {
    if (this.uiNotificationSystem === uiNotificationSystem) {
      return; // Already connected to the same system
    }
    this.uiNotificationSystem = uiNotificationSystem;
    console.log('✅ UI Notification system connected');
  }

  disconnectUISystem() {
    this.uiNotificationSystem = null;
    console.log('❌ UI Notification system disconnected');
  }

  async sendTestNotification() {
    const testNotification = {
      title: 'Notificación de prueba',
      message: 'Sistema de notificaciones funcionando correctamente',
      type: 'success',
      created_at: new Date().toISOString()
    };

    this.handleRealtimeNotification(testNotification);
  }

  // Cleanup
  destroy() {
    this.subscriptions.clear();
    this.uiNotificationSystem = null;
    this.isInitialized = false;
    
    if (this.serviceWorkerRegistration) {
      // Unregister service worker if needed
      // this.serviceWorkerRegistration.unregister();
    }
  }
}

// Export singleton instance
const notificationManager = new NotificationManager();
export default notificationManager; 