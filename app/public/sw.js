// Lymbus Service Worker for Notifications and Offline Support
const CACHE_NAME = 'lymbus-v1.0.0';
const STATIC_CACHE_NAME = 'lymbus-static-v1.0.0';

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Installation
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then(cache => {
        return cache.addAll(STATIC_ASSETS.filter(url => {
          // Only cache existing assets
          return true; // We'll handle errors gracefully
        }));
      }),
      self.skipWaiting()
    ])
  );
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch events (for offline support)
self.addEventListener('fetch', (event) => {
  // Skip API requests entirely - let them pass through normally
  if (event.request.url.includes('/api/')) return;
  
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http requests  
  if (!event.request.url.startsWith('http')) return;
  
  // Only cache static assets
  if (event.request.url.includes('/static/') || 
      event.request.url.includes('.js') || 
      event.request.url.includes('.css') ||
      event.request.url.includes('.png') ||
      event.request.url.includes('.ico')) {
    
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});

// Push event (for push notifications)
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received:', event);
  
  let notificationData = {
    title: 'Lymbus',
    message: 'Nueva notificación disponible',
    type: 'info'
  };
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      console.warn('Failed to parse push data:', error);
      notificationData.message = event.data.text() || notificationData.message;
    }
  }
  
  const notificationOptions = {
    body: notificationData.message,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `lymbus-${notificationData.type}`,
    data: notificationData,
    requireInteraction: notificationData.type === 'error' || notificationData.type === 'warning',
    actions: [
      {
        action: 'view',
        title: 'Ver detalles',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Descartar',
        icon: '/favicon.ico'
      }
    ],
    vibrate: getVibrationPattern(notificationData.type)
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data;
  
  if (action === 'dismiss') {
    return;
  }
  
  // Default action or 'view' action
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: notificationData
          });
          return;
        }
      }
      
      // Otherwise open new window
      return clients.openWindow('/').then(client => {
        if (client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: notificationData
          });
        }
      });
    })
  );
});

// Background sync (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Message event (communication with main app)
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'UPDATE_BADGE':
      updateBadge(data.count);
      break;
    case 'CACHE_ASSETS':
      cacheAssets(data.urls);
      break;
    case 'CLEAR_CACHE':
      clearCache();
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Helper functions
function getVibrationPattern(type) {
  switch (type) {
    case 'error':
      return [200, 100, 200, 100, 200]; // More urgent pattern
    case 'warning':
      return [200, 100, 200]; // Medium urgency
    case 'success':
      return [100, 50, 100]; // Light pattern
    default:
      return [200]; // Simple vibration
  }
}

function updateBadge(count) {
  if ('setBadge' in navigator) {
    self.registration.badge = count;
  }
}

async function syncNotifications() {
  try {
    // Attempt to sync notifications when back online
    const response = await fetch('/api/notifications/unread/count');
    if (response.ok) {
      const data = await response.json();
      updateBadge(data.unread_count);
    }
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}

async function cacheAssets(urls) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls);
    console.log('✅ Assets cached successfully');
  } catch (error) {
    console.error('Failed to cache assets:', error);
  }
}

async function clearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('✅ Cache cleared successfully');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'sync-notifications') {
      event.waitUntil(syncNotifications());
    }
  });
}

console.log('🔔 Lymbus Service Worker loaded and ready!'); 