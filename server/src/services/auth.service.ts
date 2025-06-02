import { getRepository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/User';
import { VerificationToken } from '../entities/VerificationToken';
import { PasswordReset } from '../entities/PasswordReset';
import { SocialAccount, SocialProvider } from '../entities/SocialAccount';
import { EmailService } from './email.service';

// Define interfaces for auth operations
export interface RegisterUserDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SocialAuthDto {
  provider: SocialProvider;
  token: string;
  profile?: any;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Auth Service class
export class AuthService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Register a new user
   * @param userData User registration data
   * @returns User object with authentication tokens
   */
  async register(userData: RegisterUserDto): Promise<{ user: User; tokens: AuthTokens }> {
    const userRepository = getRepository(User);
    const tokenRepository = getRepository(VerificationToken);

    // Check if email already exists
    const existingEmail = await userRepository.findOne({ email: userData.email });
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await userRepository.findOne({ username: userData.username });
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Create new user
    const user = userRepository.create({
      username: userData.username,
      email: userData.email,
      password: userData.password, // Will be hashed by entity hook
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: UserRole.STUDENT,
      isVerified: false,
    });

    // Save user
    await userRepository.save(user);

    // Create verification token
    const verificationToken = tokenRepository.create({
      user,
    });

    // Save verification token
    await tokenRepository.save(verificationToken);

    // Send verification email
    await this.emailService.sendVerificationEmail(user, verificationToken.token);

    // Generate auth tokens
    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * Login a user
   * @param loginData Login credentials
   * @returns User object with authentication tokens
   */
  async login(loginData: LoginUserDto): Promise<{ user: User; tokens: AuthTokens }> {
    const userRepository = getRepository(User);

    // Find user by email with password included
    const user = await userRepository
      .createQueryBuilder('user')
      .addSelect('user.password') // Include password field which is excluded by default
      .where('user.email = :email', { email: loginData.email })
      .getOne();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new Error('Your account has been locked. Please contact support.');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('Your account is inactive. Please contact support.');
    }

    // Check if email is verified (can be made optional)
    const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
    if (requireEmailVerification && !user.isVerified) {
      throw new Error('Please verify your email before logging in');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(loginData.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await userRepository.save(user);

    // Generate auth tokens
    const tokens = this.generateTokens(user);

    return { 
      user: user.toResponseObject(), 
      tokens 
    };
  }

  /**
   * Verify a user's email with the provided token
   * @param token Verification token
   * @returns Success message
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenRepository = getRepository(VerificationToken);
    const userRepository = getRepository(User);

    // Find token
    const verificationToken = await tokenRepository.findOne({ 
      where: { token },
      relations: ['user']
    });

    if (!verificationToken) {
      throw new Error('Invalid verification token');
    }

    // Check if token is valid
    if (!verificationToken.isValid()) {
      throw new Error('Verification token has expired');
    }

    // Update user
    const user = verificationToken.user;
    user.isVerified = true;
    await userRepository.save(user);

    // Mark token as used
    verificationToken.isUsed = true;
    await tokenRepository.save(verificationToken);

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   * @param email User email
   * @returns Success message
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const userRepository = getRepository(User);
    const tokenRepository = getRepository(VerificationToken);

    // Find user
    const user = await userRepository.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if already verified
    if (user.isVerified) {
      throw new Error('Email is already verified');
    }

    // Create new verification token
    const verificationToken = tokenRepository.create({
      user,
    });

    // Save verification token
    await tokenRepository.save(verificationToken);

    // Send verification email
    await this.emailService.sendVerificationEmail(user, verificationToken.token);

    return { message: 'Verification email sent' };
  }

  /**
   * Request a password reset
   * @param email User email
   * @returns Success message
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const userRepository = getRepository(User);
    const resetRepository = getRepository(PasswordReset);

    // Find user
    const user = await userRepository.findOne({ email: forgotPasswordDto.email });
    if (!user) {
      // Don't reveal that the email doesn't exist
      return { message: 'If your email exists, you will receive a password reset link' };
    }

    // Create password reset token
    const passwordReset = resetRepository.create({
      user,
    });

    // Save password reset token
    await resetRepository.save(passwordReset);

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user, passwordReset.token);

    return { message: 'Password reset instructions sent to your email' };
  }

  /**
   * Reset password with token
   * @param resetPasswordDto Token and new password
   * @returns Success message
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const resetRepository = getRepository(PasswordReset);
    const userRepository = getRepository(User);

    // Validate passwords match
    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Find token
    const passwordReset = await resetRepository.findOne({ 
      where: { token: resetPasswordDto.token },
      relations: ['user']
    });

    if (!passwordReset) {
      throw new Error('Invalid password reset token');
    }

    // Check if token is valid
    if (!passwordReset.isValid()) {
      throw new Error('Password reset token has expired');
    }

    // Update user password
    const user = passwordReset.user;
    user.password = resetPasswordDto.password;
    await userRepository.save(user);

    // Mark token as used
    passwordReset.isUsed = true;
    await resetRepository.save(passwordReset);

    return { message: 'Password reset successful' };
  }

  /**
   * Change password for authenticated user
   * @param userId User ID
   * @param changePasswordDto Current and new password
   * @returns Success message
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const userRepository = getRepository(User);

    // Validate passwords match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new Error('New passwords do not match');
    }

    // Find user with password
    const user = await userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(changePasswordDto.currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = changePasswordDto.newPassword;
    await userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  /**
   * Handle social authentication
   * @param socialAuthDto Social auth data
   * @returns User object with authentication tokens
   */
  async socialAuth(socialAuthDto: SocialAuthDto): Promise<{ user: User; tokens: AuthTokens; isNewUser: boolean }> {
    const userRepository = getRepository(User);
    const socialRepository = getRepository(SocialAccount);

    // Validate social token (this would be a call to the provider's API)
    // For demonstration, we're assuming the token is valid
    // and the profile data is already extracted and provided

    if (!socialAuthDto.profile) {
      throw new Error('Invalid social profile data');
    }

    const { provider, profile } = socialAuthDto;
    const providerId = profile.id;
    const email = profile.email;
    
    // First, check if this social account exists
    let socialAccount = await socialRepository.findOne({
      where: { provider, providerId },
      relations: ['user']
    });

    let user: User;
    let isNewUser = false;

    if (socialAccount) {
      // Social account exists, get the associated user
      user = socialAccount.user;
    } else {
      // Check if user exists with this email
      user = await userRepository.findOne({ email });
      
      if (!user) {
        // Create new user
        user = userRepository.create({
          email,
          username: email.split('@')[0] + Math.floor(Math.random() * 1000), // Generate username
          firstName: profile.firstName || profile.given_name || profile.name?.split(' ')[0] || 'User',
          lastName: profile.lastName || profile.family_name || profile.name?.split(' ').slice(1).join(' ') || String(Date.now()),
          // Generate random password (user can change later)
          password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
          isVerified: true, // Social logins are considered verified
        });
        
        isNewUser = true;
      }
      
      // Save user
      await userRepository.save(user);
      
      // Create social account
      socialAccount = socialRepository.create({
        provider,
        providerId,
        user,
        accessToken: socialAuthDto.token,
        profile
      });
      
      // Save social account
      await socialRepository.save(socialAccount);
    }

    // Update last login
    user.lastLogin = new Date();
    await userRepository.save(user);

    // Generate auth tokens
    const tokens = this.generateTokens(user);

    return { 
      user: user.toResponseObject(), 
      tokens,
      isNewUser
    };
  }

  /**
   * Refresh authentication tokens
   * @param refreshToken Refresh token
   * @returns New tokens
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as any;
      
      const userRepository = getRepository(User);
      const user = await userRepository.findOne(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Generate JWT tokens for authentication
   * @param user User object
   * @returns Access and refresh tokens
   */
  private generateTokens(user: User): AuthTokens {
    const accessToken = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    
    return {
      accessToken,
      refreshToken,
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '3600', 10)
    };
  }
}

// Export singleton instance
export const authService = new AuthService();

