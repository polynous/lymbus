import React, { useState, useEffect } from 'react';
import { FiCommand } from 'react-icons/fi';
import simpleWebSocketService from '../services/simpleWebSocket';

const PageHeader = ({ 
  title, 
  subtitle, 
  showRealTimeIndicator = true, 
  keyboardShortcut = 'S', 
  keyboardShortcutLabel = 'para acceder rápidamente',
  children,
  className = ''
}) => {
  // Real-time connection status
  const [isConnected, setIsConnected] = useState(simpleWebSocketService.isConnected());
  const [recentUpdates, setRecentUpdates] = useState(0);

  useEffect(() => {
    // Check connection status periodically
    const checkConnection = () => {
      setIsConnected(simpleWebSocketService.isConnected());
    };
    
    const interval = setInterval(checkConnection, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Real-time Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {title}
            </h1>
            
            {/* Keyboard shortcut badge */}
            {keyboardShortcut && (
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1">
                <FiCommand className="h-3 w-3" />
                <span>Ctrl + {keyboardShortcut}</span>
              </div>
            )}
          </div>
          
          {subtitle && (
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
          
          {/* Connection status indicator */}
          {showRealTimeIndicator && (
            <div className={`mt-2 text-xs ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isConnected ? 'Tiempo real activo' : 'Desconectado'}
            </div>
          )}
        </div>
        
        {/* Action buttons or additional content */}
        {children && (
          <div className="flex items-center space-x-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader; 