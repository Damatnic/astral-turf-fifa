import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  /**
   * Send email verification link to user
   */
  async sendVerificationEmail(email: string, token: string, userName: string): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Astral Turf Account',
        template: './verification-email',
        context: {
          userName,
          verificationUrl,
          token,
        },
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    const loginUrl = `${this.frontendUrl}/login`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to Astral Turf!',
        template: './welcome-email',
        context: {
          userName,
          loginUrl,
          dashboardUrl: `${this.frontendUrl}/dashboard`,
        },
      });

      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
      // Don't throw - welcome email is not critical
    }
  }

  /**
   * Send password reset email
   * (For future Task #6 - Password Reset)
   */
  async sendPasswordResetEmail(email: string, token: string, userName: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your Astral Turf Password',
        template: './password-reset-email',
        context: {
          userName,
          resetUrl,
          token,
        },
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send test email to verify email configuration
   */
  async sendTestEmail(email: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Astral Turf Email Test',
        html: '<p>Your email configuration is working correctly!</p>',
      });

      this.logger.log(`Test email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send test email to ${email}`, error);
      throw error;
    }
  }
}
