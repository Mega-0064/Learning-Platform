import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import { User, UserRole } from '../entities/User';

// Extend the Express Request interface to include the user object
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

/**
 * Interface for decoded JWT token
 */
interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Middleware to authenticate a user using JWT
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    // Check if the header is in the correct format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Invalid authorization format' });
    }

    const token = parts[1];
    
    // Verify the token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    ) as TokenPayload;
    
    // Find the user
    const userRepository = getRepository(User);
    const user = await userRepository.findOne(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }
    
    // Check if user is locked
    if (user.isLocked) {
      return res.status(403).json({ message: 'Account is locked' });
    }
    
    // Attach the user and token to the request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has the required role
 * @param roles Allowed roles
 */
export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    next();
  };
};

/**
 * Middleware to verify email is confirmed
 */
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (!req.user.isVerified) {
    return res.status(403).json({ message: 'Email not verified' });
  }
  
  next();
};

/**
 * Middleware to check if request is for the current user
 * Useful for operations like updating user profile
 */
export const isCurrentUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const userId = req.params.id;
  if (req.user.id !== userId) {
    return res.status(403).json({ message: 'Not authorized to access this resource' });
  }
  
  next();
};

/**
 * Optional authentication middleware - doesn't error if no token is provided
 * Useful for routes that work differently for authenticated vs anonymous users
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(); // No token, continue as anonymous
    }

    // Check if the header is in the correct format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next(); // Invalid format, continue as anonymous
    }

    const token = parts[1];
    
    // Verify the token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    ) as TokenPayload;
    
    // Find the user
    const userRepository = getRepository(User);
    const user = await userRepository.findOne(decoded.id);
    
    if (user && user.isActive && !user.isLocked) {
      // Attach the user and token to the request
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // For optional auth, continue as anonymous even if token is invalid
    next();
  }
};

