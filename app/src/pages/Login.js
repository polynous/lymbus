import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useNotification } from '../components/NotificationSystem';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLoader } from 'react-icons/fi';
import DarkModeToggle from '../components/DarkModeToggle';

// Import logo using require
const logo = require('../images/logo.svg').default;

// Environment variables for demo credentials
const demoAdminEmail = process.env.REACT_APP_DEMO_ADMIN_EMAIL;
const demoAdminPassword = process.env.REACT_APP_DEMO_ADMIN_PASSWORD;
const demoStaffPassword = process.env.REACT_APP_DEMO_STAFF_PASSWORD;
const demoParentPassword = process.env.REACT_APP_DEMO_PARENT_PASSWORD;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { error: showError, success } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in (immediately, no message)
  useEffect(() => {
    if (isAuthenticated) {
      // Always redirect to dashboard
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // If already authenticated, don't render anything (prevents flash)
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      showError('Por favor, completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        success('¡Bienvenido de vuelta!');
        // Always redirect to dashboard after login
        navigate('/app', { replace: true });
      } else {
        showError(result.message || 'Credenciales incorrectas');
      }
    } catch (error) {
      showError('Error de conexión. Por favor, inténtalo de nuevo.');
      console.error('Error de inicio de sesión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-600/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-indigo-400/20 to-purple-600/20 blur-3xl"></div>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <DarkModeToggle size="md" variant="default" />
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl mb-6 group transition-transform duration-300 hover:scale-105">
              <img 
                src={logo} 
                alt="Lymbus" 
                className="h-14 w-14 transition-transform duration-300 group-hover:scale-110 drop-shadow-lg filter brightness-0 invert" 
              />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Lymbus
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Sistema de gestión escolar
            </p>
          </div>

          {/* Login Form */}
          <div className="glass-card p-8 space-y-6 animate-fade-in-scale">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Iniciar Sesión
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Accede a tu panel de control
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input pl-10"
                    placeholder="tu@correo.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input pl-10 pr-10"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                    ) : (
                      <FiEye className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center space-x-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión</span>
                )}
              </button>
            </form>

            {/* Demo Credentials - Conditionally rendered */}
            {demoAdminEmail && (
            <div className="mt-6 p-4 glass-card-secondary rounded-lg">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Credenciales de demostración:
              </h3>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                {demoAdminEmail && demoAdminPassword && (
                <div>
                  <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Admin:</div>
                  <div className="flex justify-between items-center">
                    <span>Email:</span>
                    <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{demoAdminEmail}</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Contraseña:</span>
                    <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{demoAdminPassword}</code>
                  </div>
                </div>
                )}
                {demoStaffPassword && (
                <div className="border-t border-slate-200 dark:border-slate-600 pt-2">
                  <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Staff:</div>
                  <div className="flex justify-between items-center">
                    <span>Cualquier email de staff</span>
                    <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{demoStaffPassword}</code>
                  </div>
                </div>
                )}
                {demoParentPassword && (
                <div className="border-t border-slate-200 dark:border-slate-600 pt-2">
                  <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Padres:</div>
                  <div className="flex justify-between items-center">
                    <span>Cualquier email de tutor</span>
                    <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{demoParentPassword}</code>
                  </div>
                </div>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
            <p>© 2025 Lymbus. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 