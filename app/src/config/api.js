// URL base de la API - now uses environment variable
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Configuración para el cliente HTTP
export const axiosConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Función para obtener el token de autenticación
export const getAuthToken = () => {
  return localStorage.getItem('lymbus_token');
};

// Función para configurar encabezados con autenticación
export const getAuthHeaders = () => {
  const token = getAuthToken();
  if (token) {
    return {
      ...axiosConfig.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return axiosConfig.headers;
}; 