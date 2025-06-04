import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import axiosClient from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationSystem';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { error: showErrorNotification } = useNotification();

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
        await getUserData();
      } else {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [getUserData]);

  useEffect(() => {
    axiosClient._sessionExpiredHandler = handleSessionExpired;
  }, [handleSessionExpired]);

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