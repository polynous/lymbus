// Simple WebSocket Test
// Run this in the browser console to test WebSocket connectivity

function testWebSocket() {
  console.log('🔌 Testing WebSocket connection...');
  
  const ws = new WebSocket('ws://localhost:8000/ws');
  
  ws.onopen = function(event) {
    console.log('✅ WebSocket connected successfully');
    
    // Send a ping message
    ws.send(JSON.stringify({ type: 'ping' }));
    console.log('📤 Sent ping message');
  };
  
  ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('📥 Received:', data);
    
    if (data.type === 'pong') {
      console.log('✅ Ping/Pong successful - connection is healthy');
      
      // Close the test connection
      setTimeout(() => {
        ws.close();
        console.log('🔌 Test connection closed');
      }, 1000);
    }
  };
  
  ws.onclose = function(event) {
    console.log('🔌 WebSocket closed:', event.code, event.reason);
  };
  
  ws.onerror = function(error) {
    console.error('❌ WebSocket error:', error);
  };
}

// Export for use
if (typeof window !== 'undefined') {
  window.testWebSocket = testWebSocket;
  console.log('WebSocket test function available as window.testWebSocket()');
}

export default testWebSocket; 