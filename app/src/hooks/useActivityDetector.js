import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const useActivityDetector = (timeoutMinutes = 30) => {
  const [isActive, setIsActive] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const { logout, isAuthenticated } = useAuth();
  const timeoutMs = timeoutMinutes * 60 * 1000;

  // Reset activity timer
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
    setIsActive(true);
  }, []);

  // Handle user activity events
  const handleActivity = useCallback(() => {
    resetActivity();
  }, [resetActivity]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up activity check interval
    const activityInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity >= timeoutMs) {
        setIsActive(false);
        console.warn('User inactive for', timeoutMinutes, 'minutes. Logging out...');
        logout();
      }
    }, 60000); // Check every minute

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(activityInterval);
    };
  }, [isAuthenticated, lastActivity, timeoutMs, timeoutMinutes, handleActivity, logout]);

  return {
    isActive,
    lastActivity,
    resetActivity,
    timeUntilTimeout: Math.max(0, timeoutMs - (Date.now() - lastActivity))
  };
};

export default useActivityDetector; 