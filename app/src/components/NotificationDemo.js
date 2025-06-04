import React from 'react';
import { 
  FiPlay, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiAlertCircle, 
  FiInfo,
  FiZap,
  FiSettings
} from 'react-icons/fi';
import { useNotification } from './NotificationSystem';
import GlassCard from './GlassCard';

const NotificationDemo = () => {
  const { success, error, warning, info, addNotification } = useNotification();

  const demoNotifications = [
    {
      type: 'success',
      title: 'Task Completed',
      message: 'Your project has been successfully submitted and is now under review.',
      action: { label: 'View Details', onClick: () => console.log('View details clicked') }
    },
    {
      type: 'info',
      title: 'New Message',
      message: 'You have received a new message from your team member about the upcoming deadline.'
    },
    {
      type: 'warning',
      title: 'Storage Almost Full',
      message: 'Your storage is 85% full. Consider upgrading your plan to avoid service interruption.'
    },
    {
      type: 'error',
      title: 'Upload Failed',
      message: 'Failed to upload your file. Please check your connection and try again.',
      duration: 8000
    },
    {
      type: 'default',
      title: 'System Update',
      message: 'A new system update is available. Update now to get the latest features.',
      action: { label: 'Update Now', onClick: () => console.log('Update clicked') }
    }
  ];

  const triggerNotification = (notification) => {
    switch (notification.type) {
      case 'success':
        success(notification.message, {
          title: notification.title,
          action: notification.action,
          duration: notification.duration
        });
        break;
      case 'error':
        error(notification.message, {
          title: notification.title,
          action: notification.action,
          duration: notification.duration
        });
        break;
      case 'warning':
        warning(notification.message, {
          title: notification.title,
          action: notification.action,
          duration: notification.duration
        });
        break;
      case 'info':
        info(notification.message, {
          title: notification.title,
          action: notification.action,
          duration: notification.duration
        });
        break;
      default:
        addNotification({
          type: 'default',
          title: notification.title,
          message: notification.message,
          action: notification.action,
          duration: notification.duration || 5000
        });
        break;
    }
  };

  const triggerAllNotifications = () => {
    demoNotifications.forEach((notification, index) => {
      setTimeout(() => {
        triggerNotification(notification);
      }, index * 800);
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <FiAlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <FiAlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <FiInfo className="h-5 w-5 text-blue-500" />;
      default:
        return <FiZap className="h-5 w-5 text-slate-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success':
        return 'from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600';
      case 'warning':
        return 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600';
      case 'error':
        return 'from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600';
      case 'info':
        return 'from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600';
      default:
        return 'from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Simple & Effective Notification System
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Test our notification system with various types of notifications. 
          Check the bell icon in the top-right corner to see persistent notifications, 
          or trigger toast notifications below.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Toast Notifications Demo */}
        <GlassCard>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <FiZap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Toast Notifications
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Temporary notifications that appear and auto-dismiss
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {demoNotifications.map((notification, index) => (
                <button
                  key={index}
                  onClick={() => triggerNotification(notification)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r ${getTypeColor(notification.type)} text-white font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group`}
                >
                  <div className="flex-shrink-0">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{notification.title}</div>
                    <div className="text-sm opacity-90">{notification.type.charAt(0).toUpperCase() + notification.type.slice(1)} notification</div>
                  </div>
                  <FiPlay className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={triggerAllNotifications}
                  className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                >
                  <FiZap className="h-4 w-4" />
                  <span>Trigger All Notifications</span>
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Dropdown Features */}
        <GlassCard>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                <FiSettings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Dropdown Features
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Persistent notifications in a beautiful dropdown
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <FiCheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-slate-900 dark:text-slate-100">Real-time Updates</div>
                    <div className="text-slate-600 dark:text-slate-400">Notifications sync automatically</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <FiCheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-slate-900 dark:text-slate-100">Mark as Read</div>
                    <div className="text-slate-600 dark:text-slate-400">Individual or bulk actions</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <FiCheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-slate-900 dark:text-slate-100">Delete & Manage</div>
                    <div className="text-slate-600 dark:text-slate-400">Full CRUD operations</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <FiCheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-slate-900 dark:text-slate-100">Beautiful UI</div>
                    <div className="text-slate-600 dark:text-slate-400">Glass morphism design</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <FiCheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-slate-900 dark:text-slate-100">Keyboard Support</div>
                    <div className="text-slate-600 dark:text-slate-400">ESC to close, accessible</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Click the bell icon in the top-right corner to see the dropdown in action!
                  </p>
                  <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span>Live notifications enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Code Example */}
      <GlassCard>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Simple Usage Example
          </h3>
          <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-slate-300 dark:text-slate-400">
              <code>{`// Import the notification hook
import { useNotification } from './components/NotificationSystem';

// Use in your component
const { success, error, warning, info } = useNotification();

// Trigger notifications
success('Task completed successfully!');
error('Something went wrong', { duration: 8000 });
warning('Please review your settings');
info('New update available', {
  action: { 
    label: 'Update Now', 
    onClick: () => handleUpdate() 
  }
});`}</code>
            </pre>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default NotificationDemo; 