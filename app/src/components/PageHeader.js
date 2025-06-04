import React from 'react';
import { FiCommand } from 'react-icons/fi';
import { useWebSocketEvent, useRealTimeData, WS_CONFIG } from '../hooks/useWebSocket';

const PageHeader = ({ 
  title, 
  subtitle, 
  showRealTimeIndicator = true, 
  keyboardShortcut = 'S', 
  keyboardShortcutLabel = 'para acceder rápidamente',
  children,
  className = ''
}) => {
  // Real-time updates for connection status
  const { updates, lastUpdate } = useRealTimeData([
    WS_CONFIG.EVENTS.STUDENT_EXIT,
    WS_CONFIG.EVENTS.STUDENT_ENTRY,
    WS_CONFIG.EVENTS.ATTENDANCE_UPDATE
  ]);

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
          
          {/* Recent updates indicator */}
          {showRealTimeIndicator && updates.length > 0 && (
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              {updates.length} actualizaciones recientes
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