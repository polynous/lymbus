import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageLoader from './PageLoader';

const ProtectedRoute = ({ 
  children, 
  allowedUserTypes = ['admin', 'staff', 'parent'], 
  fallbackPath = '/login',
  requireAuth = true 
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return <PageLoader message="Verificando permisos..." />;
  }

  // Redirect to login if authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check user type permissions
  if (isAuthenticated && user) {
    const userType = user.user_type;
    
    // If user has no type or type is not allowed, redirect
    if (!userType || !allowedUserTypes.includes(userType)) {
      // Redirect parents trying to access admin/staff routes to their dashboard
      if (userType === 'parent' && !allowedUserTypes.includes('parent')) {
        return <Navigate to="/app" replace />;
      }
      
      // Redirect to appropriate fallback
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return children;
};

// Specific route protection components for common use cases
export const AdminOnlyRoute = ({ children }) => (
  <ProtectedRoute allowedUserTypes={['admin']} fallbackPath="/app">
    {children}
  </ProtectedRoute>
);

export const StaffOnlyRoute = ({ children }) => (
  <ProtectedRoute allowedUserTypes={['admin', 'staff']} fallbackPath="/app">
    {children}
  </ProtectedRoute>
);

export const ParentOnlyRoute = ({ children }) => (
  <ProtectedRoute allowedUserTypes={['parent']} fallbackPath="/app">
    {children}
  </ProtectedRoute>
);

export const AuthenticatedRoute = ({ children }) => (
  <ProtectedRoute allowedUserTypes={['admin', 'staff', 'parent']}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute; 