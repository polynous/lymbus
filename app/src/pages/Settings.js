import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // To be removed
// import { API_URL, getAuthHeaders } from '../config/api'; // To be removed
import axiosClient from '../utils/axiosConfig'; // Added
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../components/NotificationSystem';
import { 
  FiSettings, 
  FiUser, 
  FiLock, 
  FiBell, 
  FiShield, 
  FiSave,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiAlertTriangle,
  FiRefreshCw,
  FiMoon,
  FiSun,
  FiGlobe,
  FiMail,
  FiPhone,
  FiHome,
  FiKey,
  FiDatabase,
  FiDownload,
  FiTrash2,
  FiInfo,
  FiTestTube,
  FiZap
} from 'react-icons/fi';
import PageLoader from '../components/PageLoader';
import PageHeader from '../components/PageHeader';

const Settings = () => {
  const { user, setUser } = useAuth();
  const { success, error, warning, info } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    emergency_contact: '',
    emergency_phone: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    attendance_alerts: true,
    event_reminders: true,
    security_alerts: true
  });

  const [systemSettings, setSystemSettings] = useState({
    language: 'es',
    timezone: 'America/Mexico_City',
    dark_mode: false,
    auto_backup: true,
    data_retention: '1_year'
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    setIsLoading(true);
    try {
      // const response = await axiosClient.get('/users/me/settings'); // Example API call
      // For now, using existing logic that relies on user object from useAuth, simulating async fetch
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

      if (user) {
        setProfileData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '', // Assuming these fields might exist on user object
          emergency_contact: user.emergency_contact || '',
          emergency_phone: user.emergency_phone || ''
        });
        setNotificationSettings({
          email_notifications: user.notification_preferences?.email_notifications ?? true,
          // ... other notification settings from user object ...
        });
        setSystemSettings({
          language: user.preferences?.language || 'es',
          // ... other system settings from user object ...
        });
      } else {
        // This case might not be hit if Settings page is protected and user is always available
        error('Usuario no autenticado. No se pueden cargar las configuraciones.');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      error(err.response?.data?.detail || 'Error al cargar la configuración.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) score++;
    else feedback.push('Al menos 8 caracteres');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Una letra mayúscula');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Una letra minúscula');

    if (/\d/.test(password)) score++;
    else feedback.push('Un número');

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('Un carácter especial');

    setPasswordStrength({ score, feedback });
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (field === 'new_password') {
      checkPasswordStrength(value);
    }
  };

  const handleNotificationChange = (setting, value) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleSystemChange = (setting, value) => {
    setSystemSettings(prev => ({ ...prev, [setting]: value }));
  };

  const saveSettings = async (section) => {
    setIsSaving(true);
    // Clear previous notifications from this component if any (useNotification handles global ones)
    // setNotification({ type: '', message: '' }); 

    try {
      let response;
      let updatedUserData = { ...user };

      switch (section) {
        case 'profile':
          // response = await axiosClient.put('/users/me/profile', profileData);
          // setUser({ ...user, ...response.data }); // Assuming API returns updated user profile
          await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API
          setUser({ ...user, ...profileData }); // Optimistic update for now
          success('Perfil actualizado exitosamente');
          break;
        case 'password':
          if (passwordData.new_password !== passwordData.confirm_password) {
            throw new Error('Las contraseñas no coinciden');
          }
          if (passwordStrength.score < 3) { // Assuming 3 is a minimum acceptable score
            throw new Error('La contraseña no cumple con los requisitos mínimos de seguridad.');
          }
          // response = await axiosClient.post('/users/me/password', { 
          //   current_password: passwordData.current_password, 
          //   new_password: passwordData.new_password 
          // });
          await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API
          setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
          setPasswordStrength({ score: 0, feedback: [] });
          success('Contraseña actualizada exitosamente');
          break;
        case 'notifications':
          // response = await axiosClient.put('/users/me/notification-preferences', notificationSettings);
          // setUser({ ...user, notification_preferences: response.data }); // Assuming API returns updated prefs
          await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API
          setUser({ ...user, notification_preferences: notificationSettings }); // Optimistic
          success('Preferencias de notificación actualizadas');
          break;
        case 'system':
          // response = await axiosClient.put('/users/me/system-preferences', systemSettings);
          // setUser({ ...user, preferences: response.data }); // Assuming API returns updated prefs
          await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API
          setUser({ ...user, preferences: systemSettings }); // Optimistic
          success('Configuración del sistema actualizada');
          break;
        // case 'school':
        //   // response = await axiosClient.put('/school/settings', schoolSettingsData);
        //   await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API
        //   // setSchoolSettingsData(response.data); // Or update from response
        //   success('Configuración del colegio actualizada exitosamente');
        //   break;
        default:
          throw new Error('Sección de configuración no reconocida');
      }
    } catch (err) {
      console.error(`Error saving ${section} settings:`, err);
      error(err.response?.data?.detail || err.message || `Error al guardar la sección ${section}.`);
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = () => {
    // Mock data export
    const data = {
      profile: profileData,
      settings: systemSettings,
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lymbus-settings.json';
    a.click();
    URL.revokeObjectURL(url);

    setNotification({
      type: 'success',
      message: 'Datos exportados exitosamente'
    });
  };

  const deleteAccount = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      setNotification({
        type: 'error',
        message: 'Funcionalidad de eliminación de cuenta en desarrollo'
      });
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: FiUser },
    { id: 'security', label: 'Seguridad', icon: FiShield },
    { id: 'notifications', label: 'Notificaciones', icon: FiBell },
    { id: 'system', label: 'Sistema', icon: FiSettings },
    // Conditionally add School Settings tab
    ...(user?.user_type === 'admin' || user?.role === 'admin' ? 
        [{ id: 'school', label: 'Colegio', icon: FiHome }] 
        : []),
    { id: 'data', label: 'Mis Datos', icon: FiDatabase },
    // { id: 'advanced', label: 'Avanzado', icon: FiZap }, // Example of another tab
  ];

  const getStrengthColor = (score) => {
    if (score <= 1) return 'text-red-500';
    if (score <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStrengthText = (score) => {
    if (score <= 1) return 'Muy débil';
    if (score <= 2) return 'Débil';
    if (score <= 3) return 'Media';
    if (score <= 4) return 'Fuerte';
    return 'Muy fuerte';
  };

  if (isLoading) {
    return <PageLoader text="Cargando configuraciones..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in-scale">
      <PageHeader 
        title="Configuración"
        subtitle="Personaliza tu cuenta y preferencias"
        keyboardShortcut="S"
      />

      {/* Notification */}
      {notification.message && (
        <div className={`notification ${notification.type === 'error' ? 'notification-error' : 'notification-success'} animate-fade-in`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'error' ? (
              <FiAlertTriangle className="h-5 w-5" />
            ) : (
              <FiCheck className="h-5 w-5" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="glass-card p-4">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'text-secondary hover:bg-white/20 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="glass-card p-6 animate-fade-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="icon-container icon-container-lg icon-primary">
                  <FiUser className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary">Información Personal</h2>
                  <p className="text-sm text-secondary">Actualiza tu información personal y de contacto</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={profileData.first_name}
                      onChange={(e) => handleProfileChange('first_name', e.target.value)}
                      className="glass-input"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={profileData.last_name}
                      onChange={(e) => handleProfileChange('last_name', e.target.value)}
                      className="glass-input"
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    className="glass-input opacity-60 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-muted mt-1">
                    El correo electrónico no se puede cambiar por seguridad
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="glass-input"
                      placeholder="+52 555 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                      className="glass-input"
                      placeholder="Tu dirección"
                    />
                  </div>
                </div>

                <div className="border-t border-white/10 dark:border-slate-700/30 pt-6">
                  <h3 className="text-lg font-semibold text-primary mb-4">Contacto de Emergencia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Nombre de contacto
                      </label>
                      <input
                        type="text"
                        value={profileData.emergency_contact}
                        onChange={(e) => handleProfileChange('emergency_contact', e.target.value)}
                        className="glass-input"
                        placeholder="Nombre del contacto de emergencia"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Teléfono de emergencia
                      </label>
                      <input
                        type="tel"
                        value={profileData.emergency_phone}
                        onChange={(e) => handleProfileChange('emergency_phone', e.target.value)}
                        className="glass-input"
                        placeholder="+52 555 987 6543"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => saveSettings('profile')}
                    disabled={isSaving}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <FiSave className="h-4 w-4" />
                    )}
                    <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="glass-card p-6 animate-fade-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="icon-container icon-container-lg icon-warning">
                  <FiShield className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary">Seguridad</h2>
                  <p className="text-sm text-secondary">Actualiza tu contraseña y configuración de seguridad</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Contraseña actual *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                      className="glass-input pr-10"
                      placeholder="Tu contraseña actual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword.current ? (
                        <FiEyeOff className="h-4 w-4 text-muted" />
                      ) : (
                        <FiEye className="h-4 w-4 text-muted" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Nueva contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                      className="glass-input pr-10"
                      placeholder="Tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword.new ? (
                        <FiEyeOff className="h-4 w-4 text-muted" />
                      ) : (
                        <FiEye className="h-4 w-4 text-muted" />
                      )}
                    </button>
                  </div>
                  
                  {passwordData.new_password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs text-secondary">Seguridad:</span>
                        <span className={`text-xs font-medium ${getStrengthColor(passwordStrength.score)}`}>
                          {getStrengthText(passwordStrength.score)}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full ${
                              i < passwordStrength.score
                                ? passwordStrength.score <= 1
                                  ? 'bg-red-500'
                                  : passwordStrength.score <= 3
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-secondary mb-1">Falta:</p>
                          <ul className="text-xs text-muted">
                            {passwordStrength.feedback.map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Confirmar nueva contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                      className="glass-input pr-10"
                      placeholder="Confirma tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword.confirm ? (
                        <FiEyeOff className="h-4 w-4 text-muted" />
                      ) : (
                        <FiEye className="h-4 w-4 text-muted" />
                      )}
                    </button>
                  </div>
                  {passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password && (
                    <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => saveSettings('password')}
                    disabled={isSaving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <FiLock className="h-4 w-4" />
                    )}
                    <span>{isSaving ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="glass-card p-6 animate-fade-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="icon-container icon-container-lg icon-secondary">
                  <FiBell className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary">Notificaciones</h2>
                  <p className="text-sm text-secondary">Configura cómo y cuándo quieres recibir notificaciones</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Canales de notificación</h3>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'email_notifications', label: 'Notificaciones por email', icon: FiMail },
                      { key: 'sms_notifications', label: 'Notificaciones por SMS', icon: FiPhone },
                      { key: 'push_notifications', label: 'Notificaciones push', icon: FiBell }
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="flex items-center justify-between p-3 glass-card-secondary rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5 text-muted" />
                            <span className="font-medium text-primary">{item.label}</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings[item.key]}
                              onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-white/10 dark:border-slate-700/30 pt-6">
                  <h3 className="text-lg font-semibold text-primary mb-4">Tipos de notificación</h3>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'attendance_alerts', label: 'Alertas de asistencia', desc: 'Notificaciones sobre entradas y salidas' },
                      { key: 'event_reminders', label: 'Recordatorios de eventos', desc: 'Avisos sobre eventos escolares' },
                      { key: 'security_alerts', label: 'Alertas de seguridad', desc: 'Notificaciones importantes de seguridad' }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-3 glass-card-secondary rounded-lg">
                        <div>
                          <div className="font-medium text-primary">{item.label}</div>
                          <div className="text-sm text-secondary">{item.desc}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings[item.key]}
                            onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => saveSettings('notifications')}
                    disabled={isSaving}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <FiSave className="h-4 w-4" />
                    )}
                    <span>{isSaving ? 'Guardando...' : 'Guardar Preferencias'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6 animate-fade-in">
              {/* System Settings */}
              <div className="glass-card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="icon-container icon-container-lg icon-primary">
                    <FiSettings className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-primary">Configuración del Sistema</h2>
                    <p className="text-sm text-secondary">Personaliza la apariencia y comportamiento del sistema</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Idioma
                      </label>
                      <select
                        value={systemSettings.language}
                        onChange={(e) => handleSystemChange('language', e.target.value)}
                        className="glass-input"
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Zona horaria
                      </label>
                      <select
                        value={systemSettings.timezone}
                        onChange={(e) => handleSystemChange('timezone', e.target.value)}
                        className="glass-input"
                      >
                        <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                        <option value="America/Monterrey">Monterrey (GMT-6)</option>
                        <option value="America/Tijuana">Tijuana (GMT-8)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'dark_mode', label: 'Modo oscuro', desc: 'Usar tema oscuro en toda la aplicación', icon: FiMoon },
                      { key: 'auto_backup', label: 'Respaldo automático', desc: 'Respaldar datos automáticamente', icon: FiDatabase }
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key} className="flex items-center justify-between p-3 glass-card-secondary rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5 text-muted" />
                            <div>
                              <div className="font-medium text-primary">{item.label}</div>
                              <div className="text-sm text-secondary">{item.desc}</div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={systemSettings[item.key]}
                              onChange={(e) => handleSystemChange(item.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Retención de datos
                    </label>
                    <select
                      value={systemSettings.data_retention}
                      onChange={(e) => handleSystemChange('data_retention', e.target.value)}
                      className="glass-input"
                    >
                      <option value="6_months">6 meses</option>
                      <option value="1_year">1 año</option>
                      <option value="2_years">2 años</option>
                      <option value="indefinite">Indefinido</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => saveSettings('system')}
                      disabled={isSaving}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <FiSave className="h-4 w-4" />
                      )}
                      <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div className="glass-card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="icon-container icon-container-lg icon-secondary">
                    <FiDatabase className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-primary">Gestión de Datos</h2>
                    <p className="text-sm text-secondary">Exporta o elimina tus datos personales</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 glass-card-secondary rounded-lg">
                    <div>
                      <h3 className="font-medium text-primary">Exportar datos</h3>
                      <p className="text-sm text-secondary">Descarga una copia de toda tu información</p>
                    </div>
                    <button
                      onClick={exportData}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <FiDownload className="h-4 w-4" />
                      <span>Exportar</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 glass-card-secondary rounded-lg border border-red-200 dark:border-red-800">
                    <div>
                      <h3 className="font-medium text-red-600 dark:text-red-400">Eliminar cuenta</h3>
                      <p className="text-sm text-red-500 dark:text-red-300">Esta acción no se puede deshacer</p>
                    </div>
                    <button
                      onClick={deleteAccount}
                      className="btn-danger flex items-center space-x-2"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* School Tab */}
          {activeTab === 'school' && user?.user_type === 'admin' && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-primary mb-4">Configuración del Colegio</h3>
              <p className="text-secondary">
                Aquí podrás gestionar la configuración general de la institución.
              </p>
              <div className="mt-6 p-4 border border-blue-500/30 bg-blue-500/10 rounded-lg">
                <FiInfo className="inline h-5 w-5 mr-2 text-blue-500" />
                <span className="text-blue-700 dark:text-blue-300">
                  Esta funcionalidad está en desarrollo y estará disponible próximamente.
                </span>
              </div>
              {/* Placeholder for school settings form fields */}
              {/* 
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Nombre del Colegio</label>
                  <input type="text" className="glass-input" placeholder="Nombre de tu colegio" />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Dirección</label>
                  <input type="text" className="glass-input" placeholder="Dirección del colegio" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => saveSettings('school')} 
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Configuración Colegio'}
                </button>
              </div>
              */}
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="glass-card p-6 animate-fade-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="icon-container icon-container-lg icon-secondary">
                  <FiDatabase className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary">Gestión de Datos</h2>
                  <p className="text-sm text-secondary">Exporta o elimina tus datos personales</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 glass-card-secondary rounded-lg">
                  <div>
                    <h3 className="font-medium text-primary">Exportar datos</h3>
                    <p className="text-sm text-secondary">Descarga una copia de toda tu información</p>
                  </div>
                  <button
                    onClick={exportData}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <FiDownload className="h-4 w-4" />
                    <span>Exportar</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 glass-card-secondary rounded-lg border border-red-200 dark:border-red-800">
                  <div>
                    <h3 className="font-medium text-red-600 dark:text-red-400">Eliminar cuenta</h3>
                    <p className="text-sm text-red-500 dark:text-red-300">Esta acción no se puede deshacer</p>
                  </div>
                  <button
                    onClick={deleteAccount}
                    className="btn-danger flex items-center space-x-2"
                  >
                    <FiTrash2 className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 