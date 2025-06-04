import React, { useState } from 'react';
import { FiBell, FiCheck, FiAlertCircle, FiInfo, FiTrash2, FiCheckCircle, FiRefreshCw, FiFilter } from 'react-icons/fi';
import { useNotifications } from '../hooks/useNotifications';
import PageHeader from '../components/PageHeader';
import { useNotification } from '../components/NotificationSystem';

const Notifications = () => {
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedType, setSelectedType] = useState('all'); // all, success, warning, error, info
  const { success: showSuccess } = useNotification();
  
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  } = useNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheck className="h-5 w-5 text-emerald-600" />;
      case 'warning':
        return <FiAlertCircle className="h-5 w-5 text-amber-600" />;
      case 'error':
        return <FiAlertCircle className="h-5 w-5 text-red-600" />;
      case 'info':
      default:
        return <FiInfo className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;
    if (selectedType !== 'all' && notification.type !== selectedType) return false;
    return true;
  });

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificaciones"
        subtitle={`${notifications.length} notificaciones total, ${unreadCount} sin leer`}
        icon={<FiBell className="h-6 w-6" />}
      />

      {/* Controls */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Read/Unread Filter */}
            <div className="flex items-center space-x-2">
              <FiFilter className="h-4 w-4 text-slate-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="glass-input py-1 px-2 text-sm"
              >
                <option value="all">Todas</option>
                <option value="unread">Sin leer</option>
                <option value="read">Leídas</option>
              </select>
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="glass-input py-1 px-2 text-sm"
            >
              <option value="all">Todos los tipos</option>
              <option value="success">Éxito</option>
              <option value="info">Información</option>
              <option value="warning">Advertencia</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={refresh}
              disabled={isLoading}
              className="btn-secondary btn-sm flex items-center space-x-2"
            >
              <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="btn-primary btn-sm flex items-center space-x-2"
              >
                <FiCheckCircle className="h-4 w-4" />
                <span>Marcar todas como leídas</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="glass-card overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Error al cargar notificaciones
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <button onClick={refresh} className="btn-primary">
              Reintentar
            </button>
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center">
            <FiRefreshCw className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              Cargando notificaciones...
            </h3>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <FiBell className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              {filter === 'unread' ? 'No hay notificaciones sin leer' : 
               filter === 'read' ? 'No hay notificaciones leídas' :
               'No hay notificaciones'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filter === 'all' && 'Te notificaremos cuando haya algo nuevo'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group ${
                  !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className={`text-lg font-medium ${
                            !notification.read 
                              ? 'text-slate-900 dark:text-slate-100' 
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeColor(notification.type)}`}>
                            {notification.type === 'success' ? 'Éxito' :
                             notification.type === 'warning' ? 'Advertencia' :
                             notification.type === 'error' ? 'Error' : 'Info'}
                          </span>
                          {!notification.read && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Nueva
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-3">
                          {notification.message}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                          {notification.time}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                        aria-label="Eliminar notificación"
                      >
                        <FiTrash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredNotifications.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>
              Mostrando {filteredNotifications.length} de {notifications.length} notificaciones
            </span>
            <div className="flex items-center space-x-4">
              <span>{unreadCount} sin leer</span>
              <span>{notifications.length - unreadCount} leídas</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications; 