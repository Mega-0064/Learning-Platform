import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { 
  authService, 
  RegisterUserDto, 
  LoginUserDto, 
  ForgotPasswordDto, 
  ResetPasswordDto, 
  ChangePasswordDto 
} from '../services/auth.service';
import { SocialProvider } from '../entities/SocialAccount';

/**
 * Authentication Controller
 * 
 * Handles all authentication-related HTTP endpoints
 */
export class AuthController {
  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      await body('username').isString().isLength({ min: 3, max: 20 }).run(req);
      await body('email').isEmail().run(req);
      await body('password')
        .isString()
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .run(req);
      await body('firstName').isString().isLength({ min: 1 }).run(req);
      await body('lastName').isString().isLength({ min: 1 }).run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userData: RegisterUserDto = req.body;
      const result = await authService.register(userData);
      
      res.status(201).json({
        message: 'User registered successfully',
        user: result.user.toResponseObject(),
        tokens: result.tokens
      });
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message || 'Registration failed',
        error: process.env.NODE_ENV !== 'production' ? error : undefined
      });
    }
  }

  /**
   * Login a user
   * @route POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      await body('email').isEmail().run(req);
      await body('password').isString().run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const loginData: LoginUserDto = req.body;
      const result = await authService.login(loginData);
      
      res.status(200).json({
        message: 'Login successful',
        user: result.user,
        tokens: result.tokens
      });
    } catch (error) {
      // Don't reveal too much information
      res.status(401).json({
        message: 'Invalid credentials'
      });
    }
  }

  /**
   * Verify a user's email with the provided token
   * @route POST /api/auth/verify-email
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      await body('token').isString().isLength({ min: 10 }).run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { token } = req.body;
      const result = await authService.verifyEmail(token);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message || 'Email verification failed',
        error: process.env.NODE_ENV !== 'production' ? error : undefined
      });
    }
  }

  /**
   * Resend verification email
   * @route POST /api/auth/resend-verification
   */
  async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      await body('email').isEmail().run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email } = req.body;
      const result = await authService.resendVerificationEmail(email);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message || 'Failed to resend verification email',
        error: process.env.NODE_ENV !== 'production' ? error : undefined
      });
    }
  }

  /**
   * Request a password reset
   * @route POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      await body('email').isEmail().run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const forgotPasswordDto: ForgotPasswordDto = req.body;
      const result = await authService.forgotPassword(forgotPasswordDto);
      
      res.status(200).json(result);
    } catch (error) {
      // Don't reveal too much information, even on error
      res.status(200).json({
        message: 'If your email exists, you will receive a password reset link'
      });
    }
  }

  /**
   * Reset password with token
   * @route POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      await body('token').isString().isLength({ min: 10 }).run(req);
      await body('password')
        .isString()
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .run(req);
      await body('confirmPassword').isString().equals(req.body.password).run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const resetPasswordDto: ResetPasswordDto = req.body;
      const result = await authService.resetPassword(resetPasswordDto);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message || 'Password reset failed',
        error: process.env.NODE_ENV !== 'production' ? error : undefined
      });
    }
  }

  /**
   * Change password for authenticated user
   * @route POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      await body('currentPassword').isString().run(req);
      await body('newPassword')
        .isString()
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .run(req);
      await body('confirmPassword').isString().equals(req.body.newPassword).run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Get user ID from auth middleware
      const userId = (req as any).user.id;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const changePasswordDto: ChangePasswordDto = req.body;
      const result = await authService.changePassword(userId, changePasswordDto);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message || 'Password change failed',
        error: process.env.NODE_ENV !== 'production' ? error : undefined
      });
    }
  }

  /**
   * Refresh authentication tokens
   * @route POST /api/auth/refresh-token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      await body('refreshToken').isString().run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { refreshToken } = req.body;
      const tokens = await authService.refreshTokens(refreshToken);
      
      res.status(200).json(tokens);
    } catch (error) {
      res.status(401).json({
        message: 'Invalid refresh token'
      });
    }
  }

  /**
   * Logout a user (client-side only for JWT)
   * @route POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    // JWT is stateless, so we don't need to do anything server-side
    // Client should remove the token
    res.status(200).json({ message: 'Logout successful' });
  }

  /**
   * Handle social authentication
   * @route POST /api/auth/social/:provider
   */
  async socialAuth(req: Request, res: Response): Promise<void> {
    try {
      const { provider } = req.params;
      const { token, profile } = req.body;

      if (!Object.values(SocialProvider).includes(provider as SocialProvider)) {
        res.status(400).json({ message: 'Invalid provider' });
        return;
      }

      // Validate request
      await body('token').isString().run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const result = await authService.socialAuth({
        provider: provider as SocialProvider,
        token,
        profile
      });
      
      res.status(200).json({
        message: 'Social authentication successful',
        user: result.user,
        tokens: result.tokens,
        isNewUser: result.isNewUser
      });
    } catch (error) {
      res.status(401).json({
        message: (error as Error).message || 'Social authentication failed',
        error: process.env.NODE_ENV !== 'production' ? error : undefined
      });
    }
  }

  /**
   * Get current authenticated user
   * @route GET /api/auth/me
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // User should be attached by auth middleware
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      res.status(200).json(user);
    } catch (error) {
      res.status(401).json({
        message: 'Unauthorized'
      });
    }
  }
}

// Export singleton instance
export const authController = new AuthController();

