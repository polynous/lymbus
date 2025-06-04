import { wsManager } from '../hooks/useWebSocket';
import { API_URL } from '../config/api';

class WebSocketService {
  constructor() {
    this.isInitialized = false;
    this.connectionPromise = null;
  }

  // Get WebSocket URL from API URL
  getWebSocketUrl() {
    // Convert HTTP API URL to WebSocket URL
    const wsUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://').replace('/api', '/ws');
    return wsUrl;
  }

  // Initialize WebSocket connection
  async initialize() {
    if (this.isInitialized) {
      return this.connectionPromise;
    }

    const wsUrl = this.getWebSocketUrl();
    console.log('Initializing WebSocket connection to:', wsUrl);

    this.connectionPromise = wsManager.connect(wsUrl)
      .then(() => {
        console.log('WebSocket connected successfully');
        this.isInitialized = true;
        return true;
      })
      .catch((error) => {
        console.error('WebSocket connection failed:', error);
        this.isInitialized = false;
        throw error;
      });

    return this.connectionPromise;
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.isInitialized) {
      wsManager.disconnect();
      this.isInitialized = false;
      this.connectionPromise = null;
    }
  }

  // Reconnect WebSocket
  async reconnect() {
    this.disconnect();
    return this.initialize();
  }

  // Check if connected
  isConnected() {
    return wsManager.getConnectionInfo().isConnected;
  }

  // Get connection info
  getConnectionInfo() {
    return wsManager.getConnectionInfo();
  }

  // Send message through WebSocket
  send(data) {
    wsManager.send(data);
  }

  // Subscribe to events
  subscribe(eventType, callback) {
    return wsManager.subscribe(eventType, callback);
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService; 