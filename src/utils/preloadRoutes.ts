import React from 'react';

// Types
export interface PreloadableComponent<T = React.ComponentType<any>> {
  preload: () => Promise<void>;
  component: T;
}

/**
 * Create a preloadable component from a dynamic import
 * @param importFn The dynamic import function (React.lazy)
 * @returns Object with preload function and component
 */
export function createPreloadableComponent<T = React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): PreloadableComponent<React.LazyExoticComponent<T>> {
  // Store the dynamic import function
  const lazyImport = importFn;
  
  // Create a lazy component using React.lazy
  const LazyComponent = React.lazy(lazyImport);
  
  // Return an object with the component and a preload function
  return {
    component: LazyComponent,
    preload: () => {
      try {
        // Initiate the dynamic import but don't wait for it to complete
        const preloadPromise = lazyImport().then(
          (moduleExports) => {
            // Import completed successfully
            console.debug(`Route preloaded successfully`);
            return moduleExports;
          },
          (error) => {
            // Import failed
            console.error(`Route preloading failed:`, error);
            throw error;
          }
        );
        return preloadPromise;
      } catch (error) {
        console.error('Preloading error:', error);
        return Promise.reject(error);
      }
    },
  };
}

// Preloadable routes
export const routes = {
  home: createPreloadableComponent(() => import('../pages/Home')),
  courses: createPreloadableComponent(() => import('../pages/Courses')),
  profile: createPreloadableComponent(() => import('../pages/Profile')),
  login: createPreloadableComponent(() => import('../pages/Login')),
  registration: createPreloadableComponent(() => import('../pages/Registration/Registration')),
  emailVerification: createPreloadableComponent(() => import('../pages/auth/EmailVerification')),
  forgotPassword: createPreloadableComponent(() => import('../pages/auth/ForgotPassword')),
  resetPassword: createPreloadableComponent(() => import('../pages/auth/ResetPassword')),
  changePassword: createPreloadableComponent(() => import('../pages/auth/ChangePassword')),
};

// Helper functions

/**
 * Preload multiple routes at once
 * @param routesToPreload Array of routes to preload
 * @returns Promise that resolves when all routes are preloaded
 */
export const preloadRoutes = (
  routesToPreload: PreloadableComponent[]
): Promise<void[]> => {
  return Promise.all(routesToPreload.map((route) => route.preload()));
};

/**
 * Preload all top-level routes
 * @returns Promise that resolves when all routes are preloaded
 */
export const preloadAllRoutes = (): Promise<void[]> => {
  return preloadRoutes(Object.values(routes));
};

/**
 * Preload a route by path
 * @param path The route path
 * @returns Promise that resolves when the route is preloaded
 */
export const preloadRouteByPath = (path: string): Promise<void> | null => {
  const routeMap: Record<string, PreloadableComponent> = {
    '/': routes.home,
    '/courses': routes.courses,
    '/profile': routes.profile,
    '/login': routes.login,
    '/register': routes.registration,
    '/verify-email': routes.emailVerification,
    '/forgot-password': routes.forgotPassword,
    '/reset-password': routes.resetPassword,
    '/change-password': routes.changePassword,
  };

  const route = routeMap[path];
  if (route) {
    return route.preload();
  }
  return null;
};

/**
 * Preload essential routes (those most commonly accessed)
 * @returns Promise that resolves when essential routes are preloaded
 */
export const preloadEssentialRoutes = (): Promise<void[]> => {
  return preloadRoutes([
    routes.home,
    routes.courses,
    routes.login,
    routes.profile,
  ]);
};

