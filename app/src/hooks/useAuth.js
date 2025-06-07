import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import axiosClient from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationSystem';

// Token utilities
const getTokenExpiration = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  const expiration = getTokenExpiration(token);
  return expiration ? Date.now() >= expiration : true;
};

const getTimeUntilExpiration = (token) => {
  if (!token) return 0;
  const expiration = getTokenExpiration(token);
  return expiration ? Math.max(0, expiration - Date.now()) : 0;
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { error: showErrorNotification, warning: showWarningNotification } = useNotification();

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Auth loading timeout - forcing loading to false');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('lymbus_token');
    setUser(null);
    
    showErrorNotification('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    
    navigate('/login', { replace: true });
  }, [navigate, showErrorNotification]);

  const getUserData = useCallback(async () => {
    try {
      const response = await axiosClient.get('/auth/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      handleSessionExpired();
    } finally {
      setIsLoading(false);
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('lymbus_token');
      
      if (token) {
        // Check if token is expired before making API call
        if (isTokenExpired(token)) {
          console.log('Token expired on startup, removing...');
          localStorage.removeItem('lymbus_token');
          setIsLoading(false);
        } else {
          await getUserData();
        }
      } else {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [getUserData]);

  useEffect(() => {
    axiosClient._sessionExpiredHandler = handleSessionExpired;
  }, [handleSessionExpired]);

  // Token expiration monitoring
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiration = () => {
      const token = localStorage.getItem('lymbus_token');
      if (!token) return;

      const timeUntilExpiration = getTimeUntilExpiration(token);
      
      // Warn user 15 minutes before expiration
      if (timeUntilExpiration > 0 && timeUntilExpiration <= 15 * 60 * 1000) {
        const minutesLeft = Math.ceil(timeUntilExpiration / (60 * 1000));
        showWarningNotification(`Tu sesión expirará en ${minutesLeft} minutos. Guarda tu trabajo.`);
      }

      // Auto-logout when token expires
      if (isTokenExpired(token)) {
        handleSessionExpired();
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60 * 1000);

    return () => clearInterval(interval);
  }, [user, handleSessionExpired, showWarningNotification]);

  const validateToken = async () => {
    try {
      await axiosClient.get('/auth/users/me');
    } catch (error) {
      console.error('Token validation failed:', error);
      handleSessionExpired();
    }
  };

  const login = async (email, password) => {
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      
      const response = await axiosClient.post('/auth/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token } = response.data;
      localStorage.setItem('lymbus_token', access_token);
      await getUserData();
      
      return { success: true };
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Error al iniciar sesión'
      };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('lymbus_token');
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    handleSessionExpired
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}; 