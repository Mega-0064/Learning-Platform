# React Learning Platform

## Authentication System

The authentication system is fully implemented with the following components:

### 1. Registration and Login Flow
- `src/pages/Login.tsx` - Handles user login
- `src/pages/Registration/Registration.tsx` - Handles user registration
- Both pages use Formik and Yup for form validation

### 2. Authentication State Management
- `src/features/auth/authSlice.ts` - Redux slice for auth state
- Implements register, login, and logout actions
- Handles loading and error states

### 3. Protected Routes
- `src/components/auth/ProtectedRoute.tsx` - Guards routes requiring authentication
- Redirects unauthenticated users to login
- Preserves the original URL for post-login redirection

### 4. Authentication Service
- `src/services/authService.ts` - Handles API communication
- Manages token storage and retrieval
- Provides proper error handling

### 5. TypeScript Support
- `src/utils/hooks.ts` - Provides typed Redux hooks
- `src/types/auth.ts` - Contains type definitions for auth system

## Getting Started

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm start
```

## Features
- User registration and authentication
- Protected routes
- Form validation
- TypeScript support
- Material UI components

## Implementation Notes

The authentication system is now fully integrated with:

1. **Working TypeScript Redux Hooks** (`src/utils/hooks.ts`)
   ```typescript
   // These hooks are already implemented and working correctly
   import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
   import type { RootState, AppDispatch } from '../features/store';

   export const useAppDispatch = () => useDispatch<AppDispatch>();
   export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
   ```

2. **Protected Route Component** (`src/components/auth/ProtectedRoute.tsx`)
   ```typescript
   // This component is already implemented and working correctly
   import { ReactNode } from 'react';
   import { Navigate, useLocation } from 'react-router-dom';
   import { useAppSelector } from '../../utils/hooks';

   interface ProtectedRouteProps {
     children: ReactNode;
   }

   const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
     const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
     const location = useLocation();

     if (isLoading) {
       return null;
     }

     if (!isAuthenticated) {
       return (
         <Navigate 
           to="/login" 
           state={{ from: location }} 
           replace 
         />
       );
     }

     return <>{children}</>;
   };

   export default ProtectedRoute;
   ```

3. **Registration Page** is now connected to Redux and the authentication flow

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
