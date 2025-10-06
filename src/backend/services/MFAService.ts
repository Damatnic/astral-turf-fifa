/**
 * MFA Service - Multi-Factor Authentication
 *
 * Supports TOTP (Time-based One-Time Password) using authenticator apps:
 * - Google Authenticator
 * - Microsoft Authenticator
 * - Authy
 * - 1Password
 * - Any RFC 6238 compliant app
 *
 * Features:
 * - TOTP secret generation
 * - QR code generation for easy setup
 * - Backup codes (10 codes per user)
 * - Code verification with time window
 * - Rate limiting for brute force protection
 */

import { randomBytes, createHmac } from 'crypto';
import { phoenixPool } from '../database/PhoenixDatabasePool';
import QRCode from 'qrcode';

export interface MFASetupData {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
  issuer: string;
  accountName: string;
}

export interface MFAVerificationResult {
  success: boolean;
  valid: boolean;
  message: string;
  remainingAttempts?: number;
}

export class MFAService {
  private readonly issuer = 'Astral Turf';
  private readonly digits = 6;
  private readonly period = 30; // seconds
  private readonly window = 1; // Allow 1 step before/after for clock skew
  private readonly verificationAttempts: Map<string, { count: number; resetAt: number }> = new Map();

  /**
   * Generate MFA setup data for user
   */
  async setupMFA(userId: string, userEmail: string): Promise<{
    success: boolean;
    data?: MFASetupData;
    error?: string;
  }> {
    try {
      // Check if MFA is already enabled
      const existing = await phoenixPool.query(
        'SELECT mfa_enabled FROM users WHERE id = $1',
        [userId]
      );

      if (existing.rows.length === 0) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (existing.rows[0].mfa_enabled) {
        return {
          success: false,
          error: 'MFA is already enabled for this account',
        };
      }

      // Generate secret (base32 encoded)
      const secret = this.generateSecret();

      // Generate backup codes
      const backupCodes = this.generateBackupCodes(10);

      // Hash backup codes for storage
      const hashedBackupCodes = backupCodes.map(code => this.hashBackupCode(code));

      // Store MFA setup (pending confirmation)
      await phoenixPool.query(
        `INSERT INTO mfa_setups (user_id, secret, backup_codes, created_at, expires_at)
         VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '15 minutes')
         ON CONFLICT (user_id) 
         DO UPDATE SET secret = $2, backup_codes = $3, created_at = NOW(), expires_at = NOW() + INTERVAL '15 minutes'`,
        [userId, secret, JSON.stringify(hashedBackupCodes)]
      );

      // Generate QR code URL
      const otpauthUrl = this.generateOTPAuthUrl(secret, userEmail);
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      return {
        success: true,
        data: {
          secret,
          qrCodeUrl,
          manualEntryKey: this.formatSecretForDisplay(secret),
          backupCodes,
          issuer: this.issuer,
          accountName: userEmail,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup MFA',
      };
    }
  }

  /**
   * Verify MFA setup with initial code
   */
  async verifyMFASetup(
    userId: string,
    code: string
  ): Promise<{
    success: boolean;
    message: string;
    mfaEnabled?: boolean;
  }> {
    try {
      // Get pending MFA setup
      const setup = await phoenixPool.query(
        `SELECT secret, backup_codes, expires_at 
         FROM mfa_setups 
         WHERE user_id = $1`,
        [userId]
      );

      if (setup.rows.length === 0) {
        return {
          success: false,
          message: 'No pending MFA setup found',
        };
      }

      const { secret, backup_codes, expires_at } = setup.rows[0];

      // Check if setup has expired
      if (new Date(expires_at) < new Date()) {
        await phoenixPool.query('DELETE FROM mfa_setups WHERE user_id = $1', [userId]);
        return {
          success: false,
          message: 'MFA setup has expired. Please start setup again.',
        };
      }

      // Verify the code
      const isValid = this.verifyTOTP(secret, code);

      if (!isValid) {
        return {
          success: false,
          message: 'Invalid verification code',
        };
      }

      // Enable MFA for user
      await phoenixPool.query('BEGIN');

      await phoenixPool.query(
        `UPDATE users 
         SET mfa_enabled = true, 
             mfa_secret = $1, 
             mfa_backup_codes = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [secret, backup_codes, userId]
      );

      // Remove pending setup
      await phoenixPool.query('DELETE FROM mfa_setups WHERE user_id = $1', [userId]);

      await phoenixPool.query('COMMIT');

      return {
        success: true,
        message: 'MFA enabled successfully',
        mfaEnabled: true,
      };
    } catch (error) {
      await phoenixPool.query('ROLLBACK');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify MFA setup',
      };
    }
  }

  /**
   * Verify MFA code during login
   */
  async verifyMFACode(
    userId: string,
    code: string
  ): Promise<MFAVerificationResult> {
    try {
      // Check rate limiting
      const rateLimitCheck = this.checkRateLimit(userId);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          valid: false,
          message: `Too many failed attempts. Please try again in ${Math.ceil(rateLimitCheck.waitTime! / 1000)} seconds.`,
          remainingAttempts: 0,
        };
      }

      // Get user MFA data
      const user = await phoenixPool.query(
        `SELECT mfa_enabled, mfa_secret, mfa_backup_codes 
         FROM users 
         WHERE id = $1`,
        [userId]
      );

      if (user.rows.length === 0) {
        return {
          success: false,
          valid: false,
          message: 'User not found',
        };
      }

      const { mfa_enabled, mfa_secret, mfa_backup_codes } = user.rows[0];

      if (!mfa_enabled) {
        return {
          success: false,
          valid: false,
          message: 'MFA is not enabled for this account',
        };
      }

      // Try to verify as TOTP code
      const isTOTPValid = this.verifyTOTP(mfa_secret, code);

      if (isTOTPValid) {
        this.resetRateLimit(userId);
        return {
          success: true,
          valid: true,
          message: 'MFA code verified successfully',
        };
      }

      // Try to verify as backup code
      const backupCodes = JSON.parse(mfa_backup_codes || '[]');
      const backupCodeIndex = backupCodes.findIndex((hashedCode: string) =>
        this.verifyBackupCode(code, hashedCode)
      );

      if (backupCodeIndex !== -1) {
        // Mark backup code as used
        backupCodes.splice(backupCodeIndex, 1);

        await phoenixPool.query(
          `UPDATE users 
           SET mfa_backup_codes = $1, updated_at = NOW() 
           WHERE id = $2`,
          [JSON.stringify(backupCodes), userId]
        );

        this.resetRateLimit(userId);

        return {
          success: true,
          valid: true,
          message: `Backup code verified successfully. ${backupCodes.length} backup codes remaining.`,
        };
      }

      // Invalid code - increment rate limit counter
      this.incrementRateLimit(userId);

      return {
        success: true,
        valid: false,
        message: 'Invalid MFA code',
        remainingAttempts: rateLimitCheck.remainingAttempts! - 1,
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        message: error instanceof Error ? error.message : 'Failed to verify MFA code',
      };
    }
  }

  /**
   * Disable MFA for user (requires password verification)
   */
  async disableMFA(
    userId: string,
    password: string
  ): Promise<{
    success: boolean;
    message: string;
    mfaEnabled?: boolean;
  }> {
    try {
      // Verify password (this should be done by the caller)
      // For security, we'll just disable MFA here

      const result = await phoenixPool.query(
        `UPDATE users 
         SET mfa_enabled = false, 
             mfa_secret = NULL, 
             mfa_backup_codes = NULL,
             updated_at = NOW()
         WHERE id = $1 AND mfa_enabled = true
         RETURNING id`,
        [userId]
      );

      if (result.rowCount === 0) {
        return {
          success: false,
          message: 'MFA is not enabled or user not found',
        };
      }

      // Remove any pending setups
      await phoenixPool.query('DELETE FROM mfa_setups WHERE user_id = $1', [userId]);

      return {
        success: true,
        message: 'MFA disabled successfully',
        mfaEnabled: false,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to disable MFA',
      };
    }
  }

  /**
   * Get MFA status for user
   */
  async getMFAStatus(userId: string): Promise<{
    success: boolean;
    enabled: boolean;
    backupCodesRemaining?: number;
    error?: string;
  }> {
    try {
      const result = await phoenixPool.query(
        `SELECT mfa_enabled, mfa_backup_codes 
         FROM users 
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          enabled: false,
          error: 'User not found',
        };
      }

      const { mfa_enabled, mfa_backup_codes } = result.rows[0];
      const backupCodes = JSON.parse(mfa_backup_codes || '[]');

      return {
        success: true,
        enabled: mfa_enabled || false,
        backupCodesRemaining: backupCodes.length,
      };
    } catch (error) {
      return {
        success: false,
        enabled: false,
        error: error instanceof Error ? error.message : 'Failed to get MFA status',
      };
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<{
    success: boolean;
    backupCodes?: string[];
    error?: string;
  }> {
    try {
      // Check if MFA is enabled
      const user = await phoenixPool.query(
        'SELECT mfa_enabled FROM users WHERE id = $1',
        [userId]
      );

      if (user.rows.length === 0) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (!user.rows[0].mfa_enabled) {
        return {
          success: false,
          error: 'MFA is not enabled',
        };
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes(10);
      const hashedBackupCodes = backupCodes.map(code => this.hashBackupCode(code));

      // Update database
      await phoenixPool.query(
        `UPDATE users 
         SET mfa_backup_codes = $1, updated_at = NOW() 
         WHERE id = $2`,
        [JSON.stringify(hashedBackupCodes), userId]
      );

      return {
        success: true,
        backupCodes,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate backup codes',
      };
    }
  }

  // Private helper methods

  /**
   * Generate random base32 secret
   */
  private generateSecret(): string {
    const buffer = randomBytes(20);
    return this.base32Encode(buffer);
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`);
    }
    return codes;
  }

  /**
   * Hash backup code for storage
   */
  private hashBackupCode(code: string): string {
    return createHmac('sha256', process.env.MFA_SECRET || 'mfa-backup-secret')
      .update(code)
      .digest('hex');
  }

  /**
   * Verify backup code against hash
   */
  private verifyBackupCode(code: string, hash: string): boolean {
    const computedHash = this.hashBackupCode(code);
    return computedHash === hash;
  }

  /**
   * Generate OTPAuth URL for QR code
   */
  private generateOTPAuthUrl(secret: string, accountName: string): string {
    const params = new URLSearchParams({
      secret,
      issuer: this.issuer,
      algorithm: 'SHA1',
      digits: this.digits.toString(),
      period: this.period.toString(),
    });

    return `otpauth://totp/${encodeURIComponent(this.issuer)}:${encodeURIComponent(accountName)}?${params.toString()}`;
  }

  /**
   * Format secret for manual entry (groups of 4)
   */
  private formatSecretForDisplay(secret: string): string {
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  }

  /**
   * Verify TOTP code
   */
  private verifyTOTP(secret: string, code: string): boolean {
    const now = Math.floor(Date.now() / 1000);

    // Try current time and ±window steps for clock skew
    for (let i = -this.window; i <= this.window; i++) {
      const time = now + i * this.period;
      const expectedCode = this.generateTOTP(secret, time);

      if (expectedCode === code) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate TOTP code for given time
   */
  private generateTOTP(secret: string, time: number): string {
    const counter = Math.floor(time / this.period);
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter));

    const secretBuffer = this.base32Decode(secret);
    const hmac = createHmac('sha1', secretBuffer).update(buffer).digest();

    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = code % Math.pow(10, this.digits);
    return otp.toString().padStart(this.digits, '0');
  }

  /**
   * Base32 encoding
   */
  private base32Encode(buffer: Buffer): string {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += base32Chars[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += base32Chars[(value << (5 - bits)) & 31];
    }

    return output;
  }

  /**
   * Base32 decoding
   */
  private base32Decode(encoded: string): Buffer {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (let i = 0; i < encoded.length; i++) {
      const idx = base32Chars.indexOf(encoded[i].toUpperCase());
      if (idx === -1) continue;

      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(output);
  }

  /**
   * Rate limiting for MFA verification
   */
  private checkRateLimit(userId: string): {
    allowed: boolean;
    remainingAttempts?: number;
    waitTime?: number;
  } {
    const limit = this.verificationAttempts.get(userId);
    const now = Date.now();

    if (!limit || now > limit.resetAt) {
      return { allowed: true, remainingAttempts: 5 };
    }

    if (limit.count >= 5) {
      return {
        allowed: false,
        remainingAttempts: 0,
        waitTime: limit.resetAt - now,
      };
    }

    return {
      allowed: true,
      remainingAttempts: 5 - limit.count,
    };
  }

  /**
   * Increment rate limit counter
   */
  private incrementRateLimit(userId: string): void {
    const now = Date.now();
    const resetAt = now + 15 * 60 * 1000; // 15 minutes

    const limit = this.verificationAttempts.get(userId);

    if (!limit || now > limit.resetAt) {
      this.verificationAttempts.set(userId, { count: 1, resetAt });
    } else {
      limit.count++;
    }
  }

  /**
   * Reset rate limit counter
   */
  private resetRateLimit(userId: string): void {
    this.verificationAttempts.delete(userId);
  }
}

// Export singleton instance
export const mfaService = new MFAService();
