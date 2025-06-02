import React, { ComponentType, LazyExoticComponent } from 'react'; // Ensure ComponentType and LazyExoticComponent are imported

// TActual is now constrained to React.ComponentType<any> directly in the interface
export interface PreloadableComponent<TActual extends ComponentType<any>> {
  preload: () => Promise<void>;
  component: TActual;
}

/**
 * Create a preloadable component from a dynamic import
 * @param importFn The dynamic import function (React.lazy)
 * @returns Object with preload function and component
 */
// TActual is constrained here as well.
// The return type will be PreloadableComponent<React.LazyExoticComponent<TActual>>
export function createPreloadableComponent<TActual extends ComponentType<any>>(
  importFn: () => Promise<{ default: TActual }>
): PreloadableComponent<LazyExoticComponent<TActual>> { // Adjusted return type
  const LazyComponent = React.lazy(importFn); // React.lazy will infer the type correctly here
  
  // Return an object with the component and a preload function
  return {
    component: LazyComponent,
    preload: (): Promise<void> => { // Explicitly set return type
      try {
          return importFn().then( // Changed from lazyImport() to importFn() for clarity
          () => {
            // Import completed successfully
            console.debug(`Route preloaded successfully`);
            // No return value here, so it resolves with undefined (Promise<void>)
          },
          (error) => {
            // Import failed
            console.error(`Route preloading failed:`, error);
            return Promise.reject(error);
          }
        );
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
  routesToPreload: PreloadableComponent<ComponentType<any>>[]
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
  const routeMap: Record<string, PreloadableComponent<ComponentType<any>>> = {
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

