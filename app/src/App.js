import React, { useEffect, useRef } from 'react';
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
import notificationManager from './services/notificationManager';
import { initializeAudioContext } from './utils/notificationHelpers';
import { useAuth } from './hooks/useAuth';

// New component to consume the theme context
const ThemedApp = () => {
  const { darkMode } = useTheme();
  const uiNotificationSystem = useNotification();
  const { isLoading: authLoading } = useAuth();
  const initializationRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Initialize notification system and WebSocket connection when app starts (only once)
  useEffect(() => {
    if (initializationRef.current) return;
    
    console.log('🚀 Initializing notification system...');
    
    // Connect the UI notification system to the notification manager
    notificationManager.connectUISystem(uiNotificationSystem);
    
    // Initialize WebSocket connection
    simpleWebSocket.connect();
    
    // Mark as initialized
    initializationRef.current = true;

    // Initialize audio context on first user interaction
    const handleUserInteraction = () => {
      initializeAudioContext();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    // Cleanup on unmount
    return () => {
      simpleWebSocket.disconnect();
      notificationManager.disconnectUISystem();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      initializationRef.current = false;
    };
  }, []); // Empty dependency array - run only once

  // Show loading screen while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl mb-4 animate-pulse">
            <div className="w-8 h-8 border-4 border-white border-opacity-30 border-t-white rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Cargando...
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Inicializando aplicación
          </p>
        </div>
      </div>
    );
  }

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
          <Route path="alumno/:id" element={<StudentDetail />} />
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
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthProvider> {/* AuthProvider needs to be inside Router if useAuth uses navigate */}
            <ThemedApp />
          </AuthProvider>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default AppContent; 