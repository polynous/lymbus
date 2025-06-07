import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useNotification } from '../components/NotificationSystem';
import useActivityDetector from '../hooks/useActivityDetector';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import SessionWarning from '../components/SessionWarning';
import ConnectionStatusIndicator from '../components/ConnectionStatusIndicator';
import KeyboardShortcutIndicator from '../components/KeyboardShortcutIndicator';
import { 
  FiHome, 
  FiLogOut, 
  FiMenu, 
  FiX, 
  FiArrowRight, 
  FiArrowLeft, 
  FiUser,
  FiUsers,
  FiSettings,
  FiHash,
  FiClock,
  FiCalendar,
  FiLogIn,
  FiShield,
  FiSun,
  FiMoon,
  FiChevronDown,
  FiChevronRight,
  FiActivity,
  FiTrendingUp,
  FiBell,
  FiUserPlus,
  FiTruck
} from 'react-icons/fi';
import DarkModeToggle from '../components/DarkModeToggle';
import LoadingSpinner from '../components/LoadingSpinner';
import SimpleNotificationDropdown from '../components/SimpleNotificationDropdown';
import QuickActions from '../components/QuickActions';

// Import logo using require
const logo = require('../assets/logo.svg').default;

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const { success, error } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Activity detector for automatic logout (30 minutes of inactivity)
  const { isActive, timeUntilTimeout, resetActivity } = useActivityDetector(30);
  
  // Keyboard shortcuts for power users
  useKeyboardShortcuts();

  // Determine user type and menu items
  const isParent = user?.user_type === 'parent';
  const isStaff = user?.user_type === 'staff';
  const isAdmin = user?.user_type === 'admin';

  const staffMenuItems = [
    { 
      path: '/app', 
      icon: <FiHome className="h-5 w-5" />, 
      text: 'Panel Principal',
      description: 'Vista general del sistema',
      badge: null
    },
    { 
      path: '/app/entrada', 
      icon: <FiLogIn className="h-5 w-5" />, 
      text: 'Entrada de alumnos',
      description: 'Registrar llegadas diarias',
      badge: null
    },
    { 
      path: '/app/recogida', 
      icon: <FiTruck className="h-5 w-5" />, 
      text: 'Coordinación de Recogida',
      description: 'Gestión de salidas - Staff',
      badge: null
    },
    { 
      path: '/app/maestros', 
      icon: <FiUsers className="h-5 w-5" />, 
      text: 'Vista de Maestros',
      description: 'Gestión por grupos',
      badge: null
    },
    { 
      path: '/app/invitaciones', 
      icon: <FiUserPlus className="h-5 w-5" />, 
      text: 'Gestión de Usuarios',
      description: 'Invitar padres y staff',
      badge: null
    },
    { 
      path: '/app/asistencia', 
      icon: <FiClock className="h-5 w-5" />, 
      text: 'Historial de Asistencia',
      description: 'Reportes y estadísticas',
      badge: null
    },
    { 
      path: '/app/configuracion', 
      icon: <FiSettings className="h-5 w-5" />, 
      text: 'Configuración',
      description: 'Ajustes del sistema',
      badge: null
    },
  ];

  const parentMenuItems = [
    { 
      path: '/app', 
      icon: <FiHome className="h-5 w-5" />, 
      text: 'Panel Familiar',
      description: 'Vista de mis hijos',
      badge: null
    },
    { 
      path: '/app/asistencia', 
      icon: <FiClock className="h-5 w-5" />, 
      text: 'Asistencia',
      description: 'Historial de mis hijos',
      badge: null
    },
    { 
      path: '/app/notificaciones', 
      icon: <FiBell className="h-5 w-5" />, 
      text: 'Notificaciones',
      description: 'Mensajes importantes',
      badge: null
    },
    { 
      path: '/app/configuracion', 
      icon: <FiSettings className="h-5 w-5" />, 
      text: 'Configuración',
      description: 'Ajustes de cuenta',
      badge: null
    },
  ];

  const menuItems = isParent ? parentMenuItems : staffMenuItems;

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { label: 'Inicio', path: '/app', icon: <FiHome className="h-4 w-4" /> }
    ];

    // Map path segments to breadcrumb items
    const pathMap = {
      'entrada': { label: 'Entrada de alumnos', icon: <FiLogIn className="h-4 w-4" /> },
      'recogida': { label: 'Coordinación de Recogida', icon: <FiTruck className="h-4 w-4" /> },
      'maestros': { label: 'Vista de Maestros', icon: <FiUsers className="h-4 w-4" /> },
      'invitaciones': { label: 'Gestión de Usuarios', icon: <FiUserPlus className="h-4 w-4" /> },
      'configuracion': { label: 'Configuración', icon: <FiSettings className="h-4 w-4" /> },
      'asistencia': { label: 'Historial de Asistencia', icon: <FiClock className="h-4 w-4" /> },
      'notificaciones': { label: 'Notificaciones', icon: <FiBell className="h-4 w-4" /> },
      'alumno': { label: 'Perfil de alumno', icon: <FiUser className="h-4 w-4" /> }
    };

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      if (segment === 'app') return; // Skip the 'app' segment
      
      currentPath += `/${segment}`;
      const fullPath = `/app${currentPath}`;
      
      if (pathMap[segment]) {
        breadcrumbs.push({
          label: pathMap[segment].label,
          path: fullPath,
          icon: pathMap[segment].icon,
          isLast: index === pathSegments.length - 1
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const handleLogout = async () => {
    try {
      await logout();
      success('Sesión cerrada exitosamente');
      navigate('/login');
    } catch (error) {
      error('Error al cerrar sesión');
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar on route change
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isSidebarOpen) {
          closeSidebar();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-50 transition-all duration-300`}>
        <div className="glass-card h-full m-4 overflow-hidden">
          {/* Logo Section */}
          <div className="flex items-center justify-center h-20 px-6 border-b border-white/10 dark:border-slate-700/50">
            <Link to="/app" className="flex items-center space-x-3 group">
              <div className="relative">
                <img 
                  src={logo} 
                  alt="Lymbus" 
                  className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" 
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Lymbus
              </span>
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 animate-slide-in-left ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700 dark:text-blue-300 shadow-lg shadow-blue-500/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {item.icon}
                  <div>
                    <div className="font-medium">{item.text}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </div>
                {item.badge && (
                  <span className="px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-white/10 dark:border-slate-700/50">
            <div className="flex items-center space-x-3 p-3 mb-3">
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
            >
              <FiLogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="glass-card h-full m-4 overflow-hidden">
          {/* Mobile Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10 dark:border-slate-700/50">
            <Link to="/app" className="flex items-center space-x-3" onClick={closeSidebar}>
              <img src={logo} alt="Lymbus" className="h-8 w-8" />
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Lymbus
              </span>
            </Link>
            <button
              onClick={closeSidebar}
              className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors duration-200"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 animate-slide-in-left ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700 dark:text-blue-300 shadow-lg shadow-blue-500/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {item.icon}
                  <div>
                    <div className="font-medium">{item.text}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </div>
                {item.badge && (
                  <span className="px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile User Section */}
          <div className="p-4 border-t border-white/10 dark:border-slate-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                {user.first_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
            >
              <FiLogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-72">
        {/* Top Navigation Bar */}
        <header className="glass-card m-4 mb-0">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors duration-200"
            >
              <FiMenu className="h-5 w-5" />
            </button>

            {/* Page Title or Breadcrumb */}
            <div className="flex-1 flex items-center">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center space-x-2 text-sm">
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.path}>
                    {index > 0 && (
                      <FiChevronRight className="h-4 w-4 text-muted mx-2" />
                    )}
                    {breadcrumb.isLast || breadcrumb.path === location.pathname ? (
                      <div className="flex items-center space-x-2">
                        <div className="icon-container icon-container-sm icon-primary">
                          {breadcrumb.icon}
                        </div>
                        <span className="font-semibold text-primary">
                          {breadcrumb.label}
                        </span>
                      </div>
                    ) : (
                      <Link 
                        to={breadcrumb.path}
                        className="flex items-center space-x-2 text-secondary hover:text-primary transition-colors duration-200 group"
                      >
                        <div className="icon-container icon-container-sm icon-secondary group-hover:icon-primary transition-all duration-200">
                          {breadcrumb.icon}
                        </div>
                        <span className="font-medium">
                          {breadcrumb.label}
                        </span>
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <ConnectionStatusIndicator />
              
              {/* Keyboard Shortcuts */}
              <KeyboardShortcutIndicator />
              
              {/* Notifications */}
              <SimpleNotificationDropdown />

              {/* Dark Mode Toggle */}
              <DarkModeToggle />

              {/* User Avatar (Mobile) */}
              <div className="lg:hidden">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user.first_name?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 pt-4">
          <div className="animate-fade-in-scale">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Session Warning */}
      <SessionWarning 
        timeUntilTimeout={timeUntilTimeout}
        resetActivity={resetActivity}
        isActive={isActive}
      />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
};

export default MainLayout; 