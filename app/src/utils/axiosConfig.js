import axios from 'axios';
import { API_URL } from '../config/api';
import { sanitizeData } from './safeDataUtils';

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add reasonable timeout to prevent hanging requests
  timeout: 30000, // 30 seconds
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Add token to every request
    const token = localStorage.getItem('lymbus_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log outgoing requests only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Request to ${config.url}`, config);
    }
    
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Request error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor to sanitize data
axiosInstance.interceptors.response.use(
  (response) => {
    // Sanitize response data to prevent React rendering errors
    if (response && response.data) {
      response.data = sanitizeData(response.data);
    }
    
    // Log successful responses only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Response from ${response.config.url}:`, response.data);
    }
    
    return response;
  },
  (error) => {
    // Log error responses in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.message);
    }
    
    // Handle specific error codes
    if (error.response) {
      // Server responded with an error status code
      if (process.env.NODE_ENV === 'development') {
        console.error(`Status: ${error.response.status}`, error.response.data);
      }
      
      // Handle token expiration
      if (error.response.status === 401) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Authentication token expired or invalid');
        }
        localStorage.removeItem('lymbus_token');
        
        // Call the session expired handler if it's available
        if (axiosInstance._sessionExpiredHandler) {
          axiosInstance._sessionExpiredHandler();
        }
      }
      
      // Sanitize error response data
      if (error.response.data) {
        error.response.data = sanitizeData(error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      if (process.env.NODE_ENV === 'development') {
        console.error('No response received:', error.request);
      }
    }
    
    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default axiosInstance; 