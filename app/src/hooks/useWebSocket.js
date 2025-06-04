import { useState, useEffect, useRef, useCallback } from 'react';

// WebSocket configuration
const WS_CONFIG = {
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30000,
  CONNECTION_TIMEOUT: 10000,
  EVENTS: {
    STUDENT_ENTRY: 'student_entry',
    STUDENT_EXIT: 'student_exit',
    ATTENDANCE_UPDATE: 'attendance_update',
    SYSTEM_NOTIFICATION: 'system_notification',
    USER_ACTIVITY: 'user_activity',
    CACHE_INVALIDATE: 'cache_invalidate'
  }
};

// WebSocket connection states
const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    this.heartbeatInterval = null;
    this.connectionTimeout = null;
    this.listeners = new Set();
    this.messageQueue = [];
    this.connectionState = CONNECTION_STATES.DISCONNECTED;
    this.url = null;
    this.protocols = null;
  }

  connect(url, protocols = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.url = url;
    this.protocols = protocols;
    this.connectionState = CONNECTION_STATES.CONNECTING;
    this.notifyStateChange();

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url, protocols);
        
        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, WS_CONFIG.CONNECTION_TIMEOUT);

        this.ws.onopen = (event) => {
          clearTimeout(this.connectionTimeout);
          this.connectionState = CONNECTION_STATES.CONNECTED;
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          
          // Send queued messages
          this.processMessageQueue();
          
          // Start heartbeat
          this.startHeartbeat();
          
          this.notifyStateChange();
          resolve(event);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          clearTimeout(this.connectionTimeout);
          this.stopHeartbeat();
          
          if (event.wasClean) {
            this.connectionState = CONNECTION_STATES.DISCONNECTED;
          } else {
            this.connectionState = CONNECTION_STATES.ERROR;
            this.handleReconnect();
          }
          
          this.notifyStateChange();
        };

        this.ws.onerror = (event) => {
          clearTimeout(this.connectionTimeout);
          this.connectionState = CONNECTION_STATES.ERROR;
          this.notifyStateChange();
          
          if (this.ws.readyState === WebSocket.CONNECTING) {
            reject(event);
          }
        };
      } catch (error) {
        clearTimeout(this.connectionTimeout);
        this.connectionState = CONNECTION_STATES.ERROR;
        this.notifyStateChange();
        reject(error);
      }
    });
  }

  disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.connectionState = CONNECTION_STATES.DISCONNECTED;
    this.notifyStateChange();
  }

  send(data) {
    const message = JSON.stringify(data);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
      
      // Try to reconnect if not connected
      if (this.connectionState === CONNECTION_STATES.DISCONNECTED && this.url) {
        this.handleReconnect();
      }
    }
  }

  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  addStateListener(listener) {
    this.listeners.add(listener);
    
    // Return remove function
    return () => {
      this.listeners.delete(listener);
    };
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      
      // Handle heartbeat responses
      if (data.type === 'pong') {
        return;
      }
      
      // Notify subscribers
      const callbacks = this.subscribers.get(data.type);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('WebSocket callback error:', error);
          }
        });
      }
      
      // Handle global events
      this.handleGlobalEvent(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  handleGlobalEvent(data) {
    switch (data.type) {
      case WS_CONFIG.EVENTS.CACHE_INVALIDATE:
        // Invalidate cache for specific patterns
        if (data.pattern && window.cacheManager) {
          window.cacheManager.invalidatePattern(data.pattern);
        }
        break;
      
      case WS_CONFIG.EVENTS.SYSTEM_NOTIFICATION:
        // Show system notifications
        if (window.notificationSystem && data.notification) {
          window.notificationSystem.show(data.notification);
        }
        break;
      
      default:
        // Custom event handling can be added here
        break;
    }
  }

  handleReconnect() {
    if (this.isReconnecting || this.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      return;
    }
    
    this.isReconnecting = true;
    this.connectionState = CONNECTION_STATES.RECONNECTING;
    this.notifyStateChange();
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.url, this.protocols).catch(() => {
        this.isReconnecting = false;
        
        if (this.reconnectAttempts < WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
          this.handleReconnect();
        } else {
          this.connectionState = CONNECTION_STATES.ERROR;
          this.notifyStateChange();
        }
      });
    }, WS_CONFIG.RECONNECT_INTERVAL);
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() });
    }, WS_CONFIG.HEARTBEAT_INTERVAL);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(message);
      }
    }
  }

  notifyStateChange() {
    this.listeners.forEach(listener => {
      try {
        listener({
          state: this.connectionState,
          reconnectAttempts: this.reconnectAttempts,
          queuedMessages: this.messageQueue.length
        });
      } catch (error) {
        console.error('WebSocket state listener error:', error);
      }
    });
  }

  getConnectionInfo() {
    return {
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      subscriberCount: Array.from(this.subscribers.values())
        .reduce((total, callbacks) => total + callbacks.size, 0),
      isConnected: this.ws && this.ws.readyState === WebSocket.OPEN
    };
  }
}

// Global WebSocket manager instance
const wsManager = new WebSocketManager();

// Main WebSocket hook
export const useWebSocket = (url, options = {}) => {
  const {
    protocols = null,
    autoConnect = true
  } = options;

  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [connectionInfo, setConnectionInfo] = useState(wsManager.getConnectionInfo());
  
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateConnectionInfo = useCallback((info) => {
    if (isMountedRef.current) {
      setConnectionState(info.state);
      setConnectionInfo(wsManager.getConnectionInfo());
    }
  }, []);

  useEffect(() => {
    const removeListener = wsManager.addStateListener(updateConnectionInfo);
    
    // Auto-connect if enabled
    if (autoConnect && url) {
      wsManager.connect(url, protocols).catch(console.error);
    }
    
    return removeListener;
  }, [url, protocols, autoConnect, updateConnectionInfo]);

  const connect = useCallback(() => {
    return wsManager.connect(url, protocols);
  }, [url, protocols]);

  const disconnect = useCallback(() => {
    wsManager.disconnect();
  }, []);

  const send = useCallback((data) => {
    wsManager.send(data);
  }, []);

  const subscribe = useCallback((eventType, callback) => {
    return wsManager.subscribe(eventType, callback);
  }, []);

  return {
    connectionState,
    connectionInfo,
    connect,
    disconnect,
    send,
    subscribe,
    isConnected: connectionInfo.isConnected
  };
};

// Hook for subscribing to specific events
export const useWebSocketEvent = (eventType, callback, dependencies = []) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const wrappedCallback = (data) => {
      callbackRef.current(data);
    };
    
    return wsManager.subscribe(eventType, wrappedCallback);
  }, [eventType, ...dependencies]);
};

// Hook for real-time data updates
export const useRealTimeData = (eventTypes = []) => {
  const [updates, setUpdates] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribeFunctions = eventTypes.map(eventType => {
      return wsManager.subscribe(eventType, (data) => {
        if (isMountedRef.current) {
          const update = {
            id: `${eventType}_${Date.now()}_${Math.random()}`,
            type: eventType,
            data,
            timestamp: Date.now()
          };
          
          setUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
          setLastUpdate(update);
        }
      });
    });
    
    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, [eventTypes]);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
    setLastUpdate(null);
  }, []);

  return {
    updates,
    lastUpdate,
    clearUpdates
  };
};

// Export constants and manager
export { WS_CONFIG, CONNECTION_STATES, wsManager };

const WebSocketUtils = {
  useWebSocket,
  useWebSocketEvent,
  useRealTimeData,
  WS_CONFIG,
  CONNECTION_STATES,
  wsManager
};

export default WebSocketUtils; 