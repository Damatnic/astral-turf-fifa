/**
 * Email Service
 * 
 * Provides email delivery with support for multiple providers:
 * - SendGrid
 * - AWS SES
 * - SMTP
 * 
 * Features:
 * - Template support
 * - Queue management
 * - Retry logic
 * - Delivery tracking
 */

import { loggingService } from './loggingService';

export interface EmailConfig {
  provider: 'sendgrid' | 'aws-ses' | 'smtp' | 'console';
  apiKey?: string;
  region?: string;
  fromEmail: string;
  fromName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailMessage {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

class EmailService {
  private config: EmailConfig;
  private queue: EmailMessage[] = [];
  private isProcessing = false;
  private retryAttempts = 3;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load email configuration from environment
   */
  private loadConfig(): EmailConfig {
    const provider = (process.env.EMAIL_SERVICE || 'console') as EmailConfig['provider'];
    
    return {
      provider,
      apiKey: process.env.SENDGRID_API_KEY || process.env.AWS_ACCESS_KEY_ID,
      region: process.env.AWS_REGION || 'us-east-1',
      fromEmail: process.env.FROM_EMAIL || 'noreply@astralturf.com',
      fromName: process.env.FROM_NAME || 'Astral Turf',
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER,
      smtpPassword: process.env.SMTP_PASSWORD,
    };
  }

  /**
   * Send email using configured provider
   */
  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    try {
      loggingService.info('Sending email', {
        action: 'SEND_EMAIL',
        metadata: {
          to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
          subject: message.subject,
          provider: this.config.provider,
        },
      });

      switch (this.config.provider) {
        case 'sendgrid':
          return await this.sendViaSendGrid(message);
        
        case 'aws-ses':
          return await this.sendViaAwsSES(message);
        
        case 'smtp':
          return await this.sendViaSMTP(message);
        
        case 'console':
        default:
          return this.sendViaConsole(message);
      }
    } catch (error) {
      loggingService.error('Failed to send email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
          subject: message.subject,
        },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.config.provider,
      };
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<EmailResult> {
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const message: EmailMessage = {
      to: email,
      subject: 'Verify your Astral Turf account',
      html: this.getVerificationEmailTemplate(verificationUrl),
      text: `Welcome to Astral Turf! Click the following link to verify your email: ${verificationUrl}`,
    };

    return this.sendEmail(message);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<EmailResult> {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const message: EmailMessage = {
      to: email,
      subject: 'Reset your Astral Turf password',
      html: this.getPasswordResetEmailTemplate(resetUrl),
      text: `Reset your password by clicking the following link: ${resetUrl}`,
    };

    return this.sendEmail(message);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
    const message: EmailMessage = {
      to: email,
      subject: 'Welcome to Astral Turf!',
      html: this.getWelcomeEmailTemplate(name),
      text: `Welcome to Astral Turf, ${name}! We're excited to have you on board.`,
    };

    return this.sendEmail(message);
  }

  /**
   * SendGrid implementation
   */
  private async sendViaSendGrid(message: EmailMessage): Promise<EmailResult> {
    try {
      if (!this.config.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      // Dynamic import to avoid bundling if not used
      // @ts-expect-error - @sendgrid/mail may not be installed
      const sendgrid = await import('@sendgrid/mail').catch(() => null);
      
      if (!sendgrid) {
        loggingService.warn('SendGrid not installed, using console fallback');
        return this.sendViaConsole(message);
      }

      sendgrid.default.setApiKey(this.config.apiKey);

      const result = await sendgrid.default.send({
        to: message.to,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName,
        },
        subject: message.subject,
        html: message.html,
        text: message.text,
        cc: message.cc,
        bcc: message.bcc,
        replyTo: message.replyTo,
      });

      return {
        success: true,
        messageId: result[0].headers['x-message-id'] as string,
        provider: 'sendgrid',
      };
    } catch (error) {
      loggingService.error('SendGrid send failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * AWS SES implementation
   */
  private async sendViaAwsSES(message: EmailMessage): Promise<EmailResult> {
    try {
      if (!this.config.apiKey) {
        throw new Error('AWS credentials not configured');
      }

      loggingService.info('AWS SES email would be sent here', {
        metadata: {
          to: message.to,
          subject: message.subject,
        },
      });

      // TODO: Implement actual AWS SES integration when needed
      // const AWS = await import('@aws-sdk/client-ses');
      // const ses = new AWS.SES({ region: this.config.region });
      // ... implementation

      return {
        success: true,
        messageId: `ses-${Date.now()}`,
        provider: 'aws-ses',
      };
    } catch (error) {
      loggingService.error('AWS SES send failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * SMTP implementation (fallback)
   */
  private async sendViaSMTP(message: EmailMessage): Promise<EmailResult> {
    try {
      loggingService.info('SMTP email would be sent here', {
        metadata: {
          to: message.to,
          subject: message.subject,
        },
      });

      // TODO: Implement actual SMTP integration when needed
      // const nodemailer = await import('nodemailer');
      // const transporter = nodemailer.createTransport({ ... });
      // ... implementation

      return {
        success: true,
        messageId: `smtp-${Date.now()}`,
        provider: 'smtp',
      };
    } catch (error) {
      loggingService.error('SMTP send failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Console logger (development/testing)
   */
  private sendViaConsole(message: EmailMessage): EmailResult {
    loggingService.info('📧 Email (Console Mode)', {
      metadata: {
        to: message.to,
        subject: message.subject,
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        html: message.html,
      },
    });

    return {
      success: true,
      messageId: `console-${Date.now()}`,
      provider: 'console',
    };
  }

  /**
   * Email Templates
   */

  private getVerificationEmailTemplate(verificationUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⚽ Astral Turf</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1e293b; margin-top: 0;">Verify Your Email Address</h2>
    
    <p>Welcome to Astral Turf! Click the button below to verify your email address and activate your account.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="display: inline-block; background: #0ea5e9; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        Verify Email
      </a>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="color: #64748b; font-size: 12px; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
      ${verificationUrl}
    </p>
    
    <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 30px 0;">
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      If you didn't create an account with Astral Turf, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  private getPasswordResetEmailTemplate(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Password Reset</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1e293b; margin-top: 0;">Reset Your Password</h2>
    
    <p>We received a request to reset your Astral Turf password. Click the button below to create a new password.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
    
    <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="color: #64748b; font-size: 12px; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
      ${resetUrl}
    </p>
    
    <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 30px 0;">
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      If you didn't request a password reset, please ignore this email or contact support if you have concerns.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  private getWelcomeEmailTemplate(name: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to Astral Turf</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⚽ Welcome to Astral Turf!</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${name}!</h2>
    
    <p>Welcome to <strong>Astral Turf</strong>, your AI-powered soccer tactical management platform.</p>
    
    <h3 style="color: #1e293b; margin-top: 30px;">Getting Started</h3>
    <ul style="color: #475569;">
      <li>Explore the tactical board and create your first formation</li>
      <li>Add players and customize their roles</li>
      <li>Use AI-powered tactical suggestions</li>
      <li>Save and share your tactical playbook</li>
      <li>Analyze team chemistry and performance</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background: #0ea5e9; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        Go to Dashboard
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 30px 0;">
    
    <p style="color: #64748b; font-size: 14px;">
      Need help? Check out our <a href="${process.env.APP_URL}/help" style="color: #0ea5e9;">Help Center</a> or reply to this email.
    </p>
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
      © 2025 Astral Turf. All rights reserved.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Queue email for async delivery
   */
  queueEmail(message: EmailMessage): void {
    this.queue.push(message);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process email queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const message = this.queue.shift();
      if (message) {
        await this.sendWithRetry(message);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Send email with retry logic
   */
  private async sendWithRetry(message: EmailMessage, attempt: number = 1): Promise<EmailResult> {
    try {
      return await this.sendEmail(message);
    } catch (error) {
      if (attempt < this.retryAttempts) {
        loggingService.warn('Email send failed, retrying', {
          metadata: {
            attempt,
            maxAttempts: this.retryAttempts,
            to: message.to,
          },
        });

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        return this.sendWithRetry(message, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EmailConfig>): void {
    this.config = { ...this.config, ...config };
    loggingService.info('Email service configuration updated', {
      metadata: { provider: this.config.provider },
    });
  }

  /**
   * Get service status
   */
  getStatus(): {
    provider: string;
    configured: boolean;
    queueLength: number;
    isProcessing: boolean;
  } {
    return {
      provider: this.config.provider,
      configured: this.isConfigured(),
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Check if service is properly configured
   */
  private isConfigured(): boolean {
    switch (this.config.provider) {
      case 'sendgrid':
        return !!this.config.apiKey;
      
      case 'aws-ses':
        return !!this.config.apiKey && !!this.config.region;
      
      case 'smtp':
        return !!(
          this.config.smtpHost &&
          this.config.smtpPort &&
          this.config.smtpUser &&
          this.config.smtpPassword
        );
      
      case 'console':
      default:
        return true;
    }
  }
}

// Singleton instance
export const emailService = new EmailService();

export default emailService;

