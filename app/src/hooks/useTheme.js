import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check local storage or system preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Enhanced theme transition with smooth animation
  const applyTheme = useCallback((isDark) => {
    const root = document.documentElement;
    
    // Add transition class for smooth theme switching
    root.style.setProperty('--transition-theme', '400ms cubic-bezier(0.4, 0, 0.2, 1)');
    
    // Apply the theme
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0f172a' : '#ffffff');
    }
  }, []);

  useEffect(() => {
    // Apply initial theme
    applyTheme(darkMode);
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', darkMode);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      // Only update if user hasn't manually set a preference
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode === null) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [darkMode, applyTheme]);

  const toggleDarkMode = useCallback(() => {
    setIsTransitioning(true);
    
    // Add transition flag to body for special transition effects
    document.body.classList.add('theme-transitioning');
    
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      
      // Apply theme with animation
      requestAnimationFrame(() => {
        applyTheme(newMode);
        
        // Remove transition flag after animation completes
        setTimeout(() => {
          setIsTransitioning(false);
          document.body.classList.remove('theme-transitioning');
        }, 400);
      });
      
      return newMode;
    });
  }, [applyTheme]);

  // Force a specific theme (useful for testing or user preferences)
  const setTheme = useCallback((isDark) => {
    setIsTransitioning(true);
    document.body.classList.add('theme-transitioning');
    
    setDarkMode(isDark);
    applyTheme(isDark);
    localStorage.setItem('darkMode', isDark);
    
    setTimeout(() => {
      setIsTransitioning(false);
      document.body.classList.remove('theme-transitioning');
    }, 400);
  }, [applyTheme]);

  // Get system preference
  const getSystemPreference = useCallback(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // Reset to system preference
  const resetToSystemPreference = useCallback(() => {
    localStorage.removeItem('darkMode');
    const systemPreference = getSystemPreference();
    setTheme(systemPreference);
  }, [setTheme, getSystemPreference]);

  const value = {
    darkMode,
    toggleDarkMode,
    setTheme,
    isTransitioning,
    getSystemPreference,
    resetToSystemPreference,
    // Helper for conditional styling
    theme: darkMode ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default useTheme; 