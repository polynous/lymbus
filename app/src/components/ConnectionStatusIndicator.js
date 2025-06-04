import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiWifi, FiWifiOff } from 'react-icons/fi';
import { wsManager, CONNECTION_STATES } from '../hooks/useWebSocket';

const ConnectionStatusIndicator = () => {
  const [connectionState, setConnectionState] = useState(wsManager.getConnectionInfo().state);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  useEffect(() => {
    // Subscribe to connection state changes
    const removeListener = wsManager.addStateListener((info) => {
      setConnectionState(info.state);
    });
    
    return removeListener;
  }, []);

  useEffect(() => {
    if (showTooltip && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 192; // w-48 = 12rem = 192px
      const tooltipHeight = 80; // Approximate height
      
      // Calculate position
      let top = rect.bottom + 8; // 8px gap (mt-2)
      let left = rect.right - tooltipWidth; // Right-aligned
      
      // Adjust for viewport boundaries
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Horizontal adjustment
      if (left < 8) {
        left = 8; // Minimum left margin
      } else if (left + tooltipWidth > viewportWidth - 8) {
        left = viewportWidth - tooltipWidth - 8; // Adjust to fit
      }
      
      // Vertical adjustment
      if (top + tooltipHeight > viewportHeight - 8) {
        top = rect.top - tooltipHeight - 8; // Show above if no space below
      }
      
      setTooltipPosition({ top, left });
    }
  }, [showTooltip]);

  const isConnected = connectionState === CONNECTION_STATES.CONNECTED;

  const tooltipContent = showTooltip ? createPortal(
    <div 
      className="fixed z-[9999] w-48 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl text-xs border border-slate-200 dark:border-slate-600"
      style={{ 
        top: `${tooltipPosition.top}px`, 
        left: `${tooltipPosition.left}px`,
        pointerEvents: 'none' // Prevent tooltip from interfering with mouse events
      }}
    >
      <div className="font-medium mb-1">
        Estado: {isConnected ? 'Conectado' : 'Desconectado'}
      </div>
      <div className="text-slate-500 dark:text-slate-400">
        {connectionState === CONNECTION_STATES.RECONNECTING && 'Intentando reconectar...'}
        {connectionState === CONNECTION_STATES.ERROR && 'Error de conexión'}
        {connectionState === CONNECTION_STATES.DISCONNECTED && 'Sin conexión al servidor'}
        {connectionState === CONNECTION_STATES.CONNECTING && 'Conectando...'}
        {connectionState === CONNECTION_STATES.CONNECTED && 'Conexión establecida'}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button 
        ref={buttonRef}
        className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
          isConnected 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {isConnected ? (
          <>
            <FiWifi className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Conectado</span>
          </>
        ) : (
          <>
            <FiWifiOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sin conexión</span>
          </>
        )}
      </button>
      
      {tooltipContent}
    </div>
  );
};

export default ConnectionStatusIndicator; 