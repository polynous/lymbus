import useAppStore from '../stores/appStore';

class SimpleWebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false;
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';
    console.log('Attempting WebSocket connection to:', wsUrl);
    
    // Add a small delay to ensure backend is ready
    setTimeout(() => {
      this.attemptConnection(wsUrl);
    }, 1000);
  }

  attemptConnection(wsUrl) {
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Send heartbeat
        this.sendHeartbeat();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', { code: event.code, reason: event.reason });
        this.isConnecting = false;
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  handleMessage(data) {
    const { handleRealtimeUpdate } = useAppStore.getState();
    
    switch (data.type) {
      case 'student_entry':
      case 'student_exit':
      case 'attendance_update':
        handleRealtimeUpdate(data.type, data.data);
        break;
      case 'notification':
        handleRealtimeUpdate('notification', data.data);
        break;
      case 'pong':
        // Heartbeat response - connection is alive
        break;
      default:
        console.log('Unhandled WebSocket message:', data);
    }
  }

  sendHeartbeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
      
      // Schedule next heartbeat
      setTimeout(() => this.sendHeartbeat(), 30000); // Every 30 seconds
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000); // Cap at 30 seconds
      this.reconnectAttempts++;
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      this.reconnectInterval = setTimeout(() => {
        this.attemptConnection(process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws');
      }, delay);
    } else {
      console.error('Max reconnection attempts reached. WebSocket will not reconnect automatically.');
    }
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
const simpleWebSocketService = new SimpleWebSocketService();
export default simpleWebSocketService; 