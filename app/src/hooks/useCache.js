import { useState, useEffect, useCallback, useRef } from 'react';

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_MEMORY_CACHE_SIZE: 50,
  STORAGE_PREFIX: 'lymbus_cache_',
  STRATEGIES: {
    MEMORY_ONLY: 'memory',
    STORAGE_ONLY: 'storage', 
    MEMORY_FIRST: 'memory_first',
    STORAGE_FIRST: 'storage_first'
  }
};

// In-memory cache
const memoryCache = new Map();
let memoryCacheSize = 0;

// Cache utilities
class CacheManager {
  static generateKey(key, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(k => `${k}=${JSON.stringify(params[k])}`)
      .join('&');
    return paramString ? `${key}?${paramString}` : key;
  }

  static isExpired(item) {
    return Date.now() > item.expires;
  }

  static createCacheItem(data, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    return {
      data,
      expires: Date.now() + ttl,
      created: Date.now(),
      accessed: Date.now(),
      hits: 1
    };
  }

  static updateCacheItem(item, newData = null) {
    return {
      ...item,
      data: newData !== null ? newData : item.data,
      accessed: Date.now(),
      hits: item.hits + 1
    };
  }

  // Memory cache operations
  static getFromMemory(key) {
    const item = memoryCache.get(key);
    if (!item) return null;
    
    if (this.isExpired(item)) {
      memoryCache.delete(key);
      memoryCacheSize--;
      return null;
    }
    
    const updatedItem = this.updateCacheItem(item);
    memoryCache.set(key, updatedItem);
    return updatedItem.data;
  }

  static setToMemory(key, data, ttl) {
    // Remove oldest items if cache is full
    if (memoryCacheSize >= CACHE_CONFIG.MAX_MEMORY_CACHE_SIZE) {
      this.evictOldestFromMemory();
    }
    
    const item = this.createCacheItem(data, ttl);
    memoryCache.set(key, item);
    memoryCacheSize++;
  }

  static evictOldestFromMemory() {
    let oldestKey = null;
    let oldestAccess = Date.now();
    
    for (const [key, item] of memoryCache.entries()) {
      if (item.accessed < oldestAccess) {
        oldestAccess = item.accessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      memoryCache.delete(oldestKey);
      memoryCacheSize--;
    }
  }

  // Storage cache operations
  static getFromStorage(key) {
    try {
      const stored = localStorage.getItem(CACHE_CONFIG.STORAGE_PREFIX + key);
      if (!stored) return null;
      
      const item = JSON.parse(stored);
      if (this.isExpired(item)) {
        localStorage.removeItem(CACHE_CONFIG.STORAGE_PREFIX + key);
        return null;
      }
      
      const updatedItem = this.updateCacheItem(item);
      localStorage.setItem(CACHE_CONFIG.STORAGE_PREFIX + key, JSON.stringify(updatedItem));
      return updatedItem.data;
    } catch (error) {
      console.warn('Cache storage read error:', error);
      return null;
    }
  }

  static setToStorage(key, data, ttl) {
    try {
      const item = this.createCacheItem(data, ttl);
      localStorage.setItem(CACHE_CONFIG.STORAGE_PREFIX + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Cache storage write error:', error);
      // If storage is full, try to clean up expired items
      if (error.name === 'QuotaExceededError') {
        this.cleanupExpiredStorage();
        try {
          const item = this.createCacheItem(data, ttl);
          localStorage.setItem(CACHE_CONFIG.STORAGE_PREFIX + key, JSON.stringify(item));
        } catch (retryError) {
          console.warn('Cache storage retry failed:', retryError);
        }
      }
    }
  }

  static cleanupExpiredStorage() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_CONFIG.STORAGE_PREFIX)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (this.isExpired(item)) {
            keysToRemove.push(key);
          }
        } catch (error) {
          keysToRemove.push(key); // Remove corrupted items
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleaned up ${keysToRemove.length} expired cache items`);
  }

  // Combined cache operations
  static get(key, strategy = CACHE_CONFIG.STRATEGIES.MEMORY_FIRST) {
    switch (strategy) {
      case CACHE_CONFIG.STRATEGIES.MEMORY_ONLY:
        return this.getFromMemory(key);
      
      case CACHE_CONFIG.STRATEGIES.STORAGE_ONLY:
        return this.getFromStorage(key);
      
      case CACHE_CONFIG.STRATEGIES.STORAGE_FIRST:
        return this.getFromStorage(key) || this.getFromMemory(key);
      
      case CACHE_CONFIG.STRATEGIES.MEMORY_FIRST:
      default:
        return this.getFromMemory(key) || this.getFromStorage(key);
    }
  }

  static set(key, data, ttl = CACHE_CONFIG.DEFAULT_TTL, strategy = CACHE_CONFIG.STRATEGIES.MEMORY_FIRST) {
    switch (strategy) {
      case CACHE_CONFIG.STRATEGIES.MEMORY_ONLY:
        this.setToMemory(key, data, ttl);
        break;
      
      case CACHE_CONFIG.STRATEGIES.STORAGE_ONLY:
        this.setToStorage(key, data, ttl);
        break;
      
      case CACHE_CONFIG.STRATEGIES.MEMORY_FIRST:
      case CACHE_CONFIG.STRATEGIES.STORAGE_FIRST:
      default:
        this.setToMemory(key, data, ttl);
        this.setToStorage(key, data, ttl);
        break;
    }
  }

  static invalidate(pattern) {
    // Clear memory cache
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
        memoryCacheSize--;
      }
    }
    
    // Clear storage cache
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(CACHE_CONFIG.STORAGE_PREFIX)) {
        const cacheKey = storageKey.replace(CACHE_CONFIG.STORAGE_PREFIX, '');
        if (cacheKey.includes(pattern)) {
          keysToRemove.push(storageKey);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  static clear() {
    memoryCache.clear();
    memoryCacheSize = 0;
    
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_CONFIG.STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  static getStats() {
    let storageCount = 0;
    let storageSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_CONFIG.STORAGE_PREFIX)) {
        storageCount++;
        storageSize += localStorage.getItem(key).length;
      }
    }
    
    return {
      memory: {
        size: memoryCacheSize,
        maxSize: CACHE_CONFIG.MAX_MEMORY_CACHE_SIZE
      },
      storage: {
        count: storageCount,
        sizeBytes: storageSize
      }
    };
  }
}

// Main cache hook
export const useCache = (key, fetcher, options = {}) => {
  const {
    ttl = CACHE_CONFIG.DEFAULT_TTL,
    strategy = CACHE_CONFIG.STRATEGIES.MEMORY_FIRST,
    params = {},
    enabled = true,
    staleWhileRevalidate = false
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  
  const isMountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  
  // Update fetcher ref when it changes
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const cacheKey = CacheManager.generateKey(key, params);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!enabled) return;
    
    if (!isBackground) {
      setLoading(true);
      setError(null);
    }
    
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
      });
      
      const result = await Promise.race([
        fetcherRef.current(params),
        timeoutPromise
      ]);
      
      if (!isMountedRef.current) return;
      
      // Cache the result
      CacheManager.set(cacheKey, result, ttl, strategy);
      
      setData(result);
      setIsStale(false);
      
      if (!isBackground) {
        setLoading(false);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('Cache fetch error:', err);
      setError(err);
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, [cacheKey, ttl, strategy, enabled]);

  // Initial data fetch
  useEffect(() => {
    if (!enabled) return;
    
    // Try to get from cache first
    const cachedData = CacheManager.get(cacheKey, strategy);
    
    if (cachedData !== null) {
      setData(cachedData);
      
      // If stale-while-revalidate is enabled, fetch in background
      if (staleWhileRevalidate) {
        setIsStale(true);
        fetchData(true);
      }
    } else {
      // No cache hit, fetch data
      fetchData();
    }
  }, [cacheKey, strategy, enabled, staleWhileRevalidate, fetchData]);

  const invalidate = useCallback(() => {
    CacheManager.invalidate(key);
  }, [key]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const mutate = useCallback((newData) => {
    if (typeof newData === 'function') {
      setData(prevData => {
        const updatedData = newData(prevData);
        CacheManager.set(cacheKey, updatedData, ttl, strategy);
        return updatedData;
      });
    } else {
      setData(newData);
      CacheManager.set(cacheKey, newData, ttl, strategy);
    }
  }, [cacheKey, ttl, strategy]);

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    invalidate,
    mutate
  };
};

// Cache management hook
export const useCacheManager = () => {
  const invalidatePattern = useCallback((pattern) => {
    CacheManager.invalidate(pattern);
  }, []);

  const clearCache = useCallback(() => {
    CacheManager.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return CacheManager.getStats();
  }, []);

  const cleanupExpired = useCallback(() => {
    CacheManager.cleanupExpiredStorage();
  }, []);

  return {
    invalidatePattern,
    clearCache,
    getCacheStats,
    cleanupExpired
  };
};

// Automatic cache cleanup
export const useCacheCleanup = (interval = 10 * 60 * 1000) => { // 10 minutes
  useEffect(() => {
    const cleanup = () => {
      CacheManager.cleanupExpiredStorage();
    };

    // Initial cleanup
    cleanup();

    // Set up periodic cleanup
    const intervalId = setInterval(cleanup, interval);

    return () => clearInterval(intervalId);
  }, [interval]);
};

const CacheUtils = {
  useCache,
  useCacheManager,
  useCacheCleanup,
  CacheManager,
  CACHE_CONFIG
};

export default CacheUtils; 