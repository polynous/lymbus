import { useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Performance hook for memoizing expensive computations
 */
export const useOptimizedComputation = (computeFn, deps) => {
  return useMemo(computeFn, deps);
};

/**
 * Performance hook for memoizing callbacks
 */
export const useOptimizedCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

/**
 * Performance hook for debouncing functions
 */
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

/**
 * Performance hook for throttling functions
 */
export const useThrottle = (callback, delay) => {
  const lastRan = useRef(Date.now());
  
  return useCallback((...args) => {
    if (Date.now() - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = Date.now();
    }
  }, [callback, delay]);
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      const renderTime = Date.now() - startTime.current;
      if (renderTime > 100) { // Log slow renders
        console.warn(`${componentName} slow render: ${renderTime}ms (render #${renderCount.current})`);
      }
    }
    
    startTime.current = Date.now();
  });
  
  return {
    renderCount: renderCount.current,
    logRender: (message) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render #${renderCount.current}: ${message}`);
      }
    }
  };
};

/**
 * Hook for lazy loading components
 */
export const useLazyLoad = (threshold = 100) => {
  const elementRef = useRef(null);
  const isIntersecting = useRef(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting.current = entry.isIntersecting;
        });
      },
      {
        rootMargin: `${threshold}px`,
      }
    );
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => observer.disconnect();
  }, [threshold]);
  
  return {
    elementRef,
    isVisible: isIntersecting.current
  };
};

const PerformanceUtils = {
  useOptimizedComputation,
  useOptimizedCallback,
  useDebounce,
  useThrottle,
  usePerformanceMonitor,
  useLazyLoad
};

export default PerformanceUtils; 