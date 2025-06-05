import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { NotificationProvider, useNotification } from './components/NotificationSystem';
import ProtectedRoute, { StaffOnlyRoute, ParentOnlyRoute, AuthenticatedRoute } from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentEntry from './pages/StudentEntrySimplified';
import StudentCheckout from './pages/StudentCheckout';
import TeacherGroupPickup from './pages/TeacherGroupPickup';
import InviteUsers from './pages/InviteUsers';
import Settings from './pages/Settings';
import StudentDetail from './pages/StudentDetail';
import Notifications from './pages/Notifications';
import Attendance from './pages/Attendance';
import StaffList from './pages/StaffList';
import simpleWebSocket from './services/simpleWebSocket';

// New component to consume the theme context
const ThemedApp = () => {
  const { darkMode } = useTheme();
  const { info } = useNotification();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Initialize WebSocket connection when app starts
  useEffect(() => {
    simpleWebSocket.connect();
    info('Conexión en tiempo real establecida');

    // Cleanup on unmount
    return () => {
      simpleWebSocket.disconnect();
    };
  }, [info]);

  return (
    // The div and Routes structure was previously inside AppContent's AuthProvider
    <div className="min-h-screen transition-colors duration-300">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/app" element={
          <AuthenticatedRoute>
            <MainLayout />
          </AuthenticatedRoute>
        }>
          <Route index element={<Dashboard />} />
          
          {/* Staff Management Routes */}
          <Route path="entrada" element={
            <StaffOnlyRoute>
              <StudentEntry />
            </StaffOnlyRoute>
          } />
          <Route path="recogida" element={
            <StaffOnlyRoute>
              <StudentCheckout />
            </StaffOnlyRoute>
          } />
          <Route path="maestros" element={
            <StaffOnlyRoute>
              <TeacherGroupPickup />
            </StaffOnlyRoute>
          } />
          <Route path="invitaciones" element={
            <StaffOnlyRoute>
              <InviteUsers />
            </StaffOnlyRoute>
          } />
          <Route path="personal" element={ 
            <StaffOnlyRoute>
              <StaffList />
            </StaffOnlyRoute>
          } />
          
          {/* Shared Routes */}
          <Route path="asistencia" element={<Attendance />} />
          <Route path="notificaciones" element={<Notifications />} />
          <Route path="configuracion" element={<Settings />} />
          <Route path="estudiante/:id" element={<StudentDetail />} />
        </Route>
        
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/app" replace />} />
        
        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </div>
  );
};

const AppContent = () => {
  // useTheme(), useNavigate(), useNotification() are removed from here
  return (
    <ThemeProvider>
      <NotificationProvider> {/* Router needs to be inside NotificationProvider if useNotification is used in ThemedApp/pages via navigate hook effects */}
        <Router>
          <AuthProvider> {/* AuthProvider needs to be inside Router if useAuth uses navigate */}
            <ThemedApp />
          </AuthProvider>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default AppContent; 