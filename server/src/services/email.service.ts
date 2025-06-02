import * as nodemailer from 'nodemailer';
import { User } from '../entities/User';

/**
 * Email Service
 * 
 * Handles sending emails for authentication-related functionality
 * such as email verification and password reset
 */
export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private clientUrl: string;

  constructor() {
    // Initialize the email transporter
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@learning-platform.com';
    this.clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    // In development, use a test account from ethereal.email
    if (process.env.NODE_ENV !== 'production') {
      this.setupDevTransporter();
    } else {
      this.setupProdTransporter();
    }
  }

  /**
   * Set up development email transporter using ethereal.email
   */
  private async setupDevTransporter() {
    try {
      // Create a test account on ethereal.email
      const testAccount = await nodemailer.createTestAccount();

      // Create a SMTP transporter
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('Development email transporter set up with Ethereal');
    } catch (error) {
      console.error('Failed to set up development email transporter:', error);
      // Fallback to a mock transporter
      this.transporter = {
        sendMail: async (options: nodemailer.SendMailOptions) => {
          console.log('Email sent (mock):', options);
          return { messageId: 'mock-id' };
        },
      } as any;
    }
  }

  /**
   * Set up production email transporter
   */
  private setupProdTransporter() {
    // Configure SMTP transporter for production
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log('Production email transporter set up');
  }

  /**
   * Send an email
   * @param to Recipient email address
   * @param subject Email subject
   * @param html Email HTML content
   * @param text Email plain text content (optional)
   * @returns Result of sending the email
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<any> {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: this.fromEmail,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags if text not provided
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Log email URL in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('Email sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
  }

  /**
   * Send verification email to user
   * @param user User to send verification email to
   * @param token Verification token
   * @returns Result of sending the email
   */
  async sendVerificationEmail(user: User, token: string): Promise<any> {
    const verificationLink = `${this.clientUrl}/verify-email?token=${token}`;
    const subject = 'Verify Your Email Address';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #e9e9e9;
            border-radius: 5px;
          }
          .header {
            background-color: #3f51b5;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px;
            background-color: #ffffff;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 20px 0;
            background-color: #3f51b5;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email Address</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>Thank you for registering with Learning Platform. To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
            <p><a href="${verificationLink}">${verificationLink}</a></p>
            
            <p>This link will expire in 24 hours.</p>
            
            <p>If you did not register for an account, please ignore this email.</p>
            
            <p>Best regards,<br>The Learning Platform Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Learning Platform. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send password reset email to user
   * @param user User to send password reset email to
   * @param token Password reset token
   * @returns Result of sending the email
   */
  async sendPasswordResetEmail(user: User, token: string): Promise<any> {
    const resetLink = `${this.clientUrl}/reset-password?token=${token}`;
    const subject = 'Reset Your Password';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #e9e9e9;
            border-radius: 5px;
          }
          .header {
            background-color: #3f51b5;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px;
            background-color: #ffffff;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 20px 0;
            background-color: #3f51b5;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>We received a request to reset your password for your Learning Platform account. Please click the button below to set a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            
            <p>This link will expire in 1 hour.</p>
            
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <p>Best regards,<br>The Learning Platform Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Learning Platform. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send welcome email to user after registration
   * @param user User to send welcome email to
   * @returns Result of sending the email
   */
  async sendWelcomeEmail(user: User): Promise<any> {
    const subject = 'Welcome to Learning Platform';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Learning Platform</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #e9e9e9;
            border-radius: 5px;
          }
          .header {
            background-color: #3f51b5;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px;
            background-color: #ffffff;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 20px 0;
            background-color: #3f51b5;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Learning Platform!</h1>
          </div>
          <div class="content">
            <p>Hello ${user.firstName},</p>
            <p>Welcome to Learning Platform! We're excited to have you on board.</p>
            
            <p>Here are a few things you can do to get started:</p>
            <ul>
              <li>Explore available courses</li>
              <li>Complete your profile</li>
              <li>Join our community forums</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${this.clientUrl}/courses" class="button">Explore Courses</a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The Learning Platform Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Learning Platform. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }
}

// Export a singleton instance
export const emailService = new EmailService();

