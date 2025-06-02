import { useEffect, useCallback, useState, useRef } from 'react';
import { preloadRouteByPath } from '../utils/preloadRoutes';

interface UseRoutePreloadOptions {
  /**
   * Timeout in milliseconds before preloading starts after hovering
   * Default: 150ms
   */
  hoverDelay?: number;
  
  /**
   * Callback to run after successful preloading
   */
  onPreloaded?: (path: string) => void;
  
  /**
   * Callback to run if preloading fails
   */
  onError?: (error: Error, path: string) => void;
}

interface PreloadStatus {
  isPreloading: boolean;
  isPreloaded: boolean;
  error: Error | null;
}

/**
 * Hook for managing route preloading on hover or other events
 */
export function useRoutePreload(options: UseRoutePreloadOptions = {}) {
  const { 
    hoverDelay = 150,
    onPreloaded,
    onError
  } = options;
  
  // Track preloaded routes to avoid duplicate preloading
  const preloadedRoutes = useRef<Set<string>>(new Set());
  
  // Track hover timer
  const hoverTimerRef = useRef<number | null>(null);
  
  // Status state for current preload operation
  const [preloadStatus, setPreloadStatus] = useState<Record<string, PreloadStatus>>({});
  
  // Clear any pending hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  /**
   * Handle mouse enter on a navigation item to trigger preloading
   */
  const handleMouseEnter = useCallback((path: string) => {
    // Skip if already preloaded or preloading
    if (preloadedRoutes.current.has(path) || 
        preloadStatus[path]?.isPreloading) {
      return;
    }
    
    // Clear any existing timer
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
    }
    
    // Set a timer to preload after a delay
    hoverTimerRef.current = window.setTimeout(() => {
      // Set loading state
      setPreloadStatus(prev => ({
        ...prev,
        [path]: { isPreloading: true, isPreloaded: false, error: null }
      }));
      
      // Start preloading
      const preloadPromise = preloadRouteByPath(path);
      
      if (preloadPromise) {
        preloadPromise
          .then(() => {
            // Mark as preloaded
            preloadedRoutes.current.add(path);
            setPreloadStatus(prev => ({
              ...prev,
              [path]: { isPreloading: false, isPreloaded: true, error: null }
            }));
            onPreloaded?.(path);
          })
          .catch((error) => {
            // Handle error
            console.error(`Failed to preload route ${path}:`, error);
            setPreloadStatus(prev => ({
              ...prev,
              [path]: { isPreloading: false, isPreloaded: false, error }
            }));
            onError?.(error, path);
          });
      }
      
      hoverTimerRef.current = null;
    }, hoverDelay);
  }, [hoverDelay, onPreloaded, onError, preloadStatus]);
  
  /**
   * Handle mouse leave - cancel preloading if it hasn't started yet
   */
  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);
  
  /**
   * Manually preload a route regardless of hover state
   */
  const preloadRoute = useCallback((path: string) => {
    // Skip if already preloaded
    if (preloadedRoutes.current.has(path)) {
      return Promise.resolve();
    }
    
    // Set loading state
    setPreloadStatus(prev => ({
      ...prev,
      [path]: { isPreloading: true, isPreloaded: false, error: null }
    }));
    
    // Start preloading
    const preloadPromise = preloadRouteByPath(path);
    
    if (preloadPromise) {
      return preloadPromise
        .then(() => {
          // Mark as preloaded
          preloadedRoutes.current.add(path);
          setPreloadStatus(prev => ({
            ...prev,
            [path]: { isPreloading: false, isPreloaded: true, error: null }
          }));
          onPreloaded?.(path);
        })
        .catch((error) => {
          // Handle error
          console.error(`Failed to preload route ${path}:`, error);
          setPreloadStatus(prev => ({
            ...prev,
            [path]: { isPreloading: false, isPreloaded: false, error }
          }));
          onError?.(error, path);
          throw error;
        });
    }
    
    return Promise.resolve();
  }, [onPreloaded, onError]);
  
  return {
    handleMouseEnter,
    handleMouseLeave,
    preloadRoute,
    preloadStatus,
    isPreloaded: (path: string) => preloadedRoutes.current.has(path),
  };
}

