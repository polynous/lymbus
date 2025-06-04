import React from 'react';
import { useNotification } from './NotificationSystem';
import SimpleNotificationDropdown from './SimpleNotificationDropdown';
import GlassCard from './GlassCard';

const NotificationDebugger = () => {
  const { success, error, warning, info } = useNotification();

  const testNotifications = () => {
    success('Test success notification');
    setTimeout(() => error('Test error notification'), 500);
    setTimeout(() => warning('Test warning notification'), 1000);
    setTimeout(() => info('Test info notification'), 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <GlassCard>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Notification Dropdown Debugger</h2>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Test the notification dropdown:</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Click the bell icon below to test the dropdown functionality
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={testNotifications}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Test Toast Notifications
              </button>
              
              <SimpleNotificationDropdown />
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">Debug Information:</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Open the browser console to see debugging logs when clicking the bell icon.
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Expected Behavior:</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Bell icon should toggle dropdown on click</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Clicking outside dropdown should close it</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Pressing Escape should close dropdown</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Should work with global mousedown handlers</span>
            </li>
          </ul>
        </div>
      </GlassCard>
    </div>
  );
};

export default NotificationDebugger; 