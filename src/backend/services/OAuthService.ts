/**
 * OAuth Service - Social Authentication Integration
 *
 * Supports multiple OAuth providers:
 * - Google
 * - GitHub
 * - Microsoft
 * - Facebook
 *
 * Features:
 * - PKCE flow for enhanced security
 * - State parameter for CSRF protection
 * - Account linking to existing users
 * - Profile synchronization
 * - Token exchange and refresh
 */

import { randomBytes, createHash } from 'crypto';
import axios from 'axios';
import { phoenixPool } from '../database/PhoenixDatabasePool';

export interface OAuthProvider {
  name: 'google' | 'github' | 'microsoft' | 'facebook';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}

export interface OAuthState {
  state: string;
  codeVerifier: string;
  provider: string;
  timestamp: number;
  returnUrl?: string;
}

export interface OAuthUserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  locale?: string;
}

export interface OAuthAccount {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
  tokenType: string;
  idToken?: string;
}

export class OAuthService {
  private providers: Map<string, OAuthProvider>;
  private stateStore: Map<string, OAuthState> = new Map();

  constructor() {
    this.providers = new Map();
    this.initializeProviders();
    this.startCleanupTask();
  }

  /**
   * Initialize OAuth provider configurations
   */
  private initializeProviders(): void {
    // Google OAuth
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.providers.set('google', {
        name: 'google',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback/google',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scopes: ['openid', 'email', 'profile'],
      });
    }

    // GitHub OAuth
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      this.providers.set('github', {
        name: 'github',
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/callback/github',
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        scopes: ['read:user', 'user:email'],
      });
    }

    // Microsoft OAuth
    if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
      this.providers.set('microsoft', {
        name: 'microsoft',
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/auth/callback/microsoft',
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        scopes: ['openid', 'email', 'profile'],
      });
    }

    // Facebook OAuth
    if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
      this.providers.set('facebook', {
        name: 'facebook',
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/auth/callback/facebook',
        authorizationUrl: 'https://www.facebook.com/v12.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v12.0/oauth/access_token',
        userInfoUrl: 'https://graph.facebook.com/v12.0/me',
        scopes: ['email', 'public_profile'],
      });
    }

    console.log(`✅ Initialized ${this.providers.size} OAuth providers:`, Array.from(this.providers.keys()));
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  async generateAuthorizationUrl(
    provider: 'google' | 'github' | 'microsoft' | 'facebook',
    options?: {
      returnUrl?: string;
      prompt?: 'none' | 'consent' | 'select_account';
      loginHint?: string;
    },
  ): Promise<{
    success: boolean;
    redirectUrl?: string;
    state?: string;
    error?: string;
  }> {
    try {
      const providerConfig = this.providers.get(provider);

      if (!providerConfig) {
        return {
          success: false,
          error: `OAuth provider '${provider}' is not configured`,
        };
      }

      // Generate state for CSRF protection
      const state = randomBytes(32).toString('hex');

      // Generate PKCE code verifier and challenge
      const codeVerifier = randomBytes(32).toString('base64url');
      const codeChallenge = createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      // Store state and code verifier
      const stateData: OAuthState = {
        state,
        codeVerifier,
        provider,
        timestamp: Date.now(),
        returnUrl: options?.returnUrl,
      };

      this.stateStore.set(state, stateData);

      // Build authorization URL
      const params = new URLSearchParams({
        client_id: providerConfig.clientId,
        redirect_uri: providerConfig.redirectUri,
        response_type: 'code',
        scope: providerConfig.scopes.join(' '),
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      // Add optional parameters
      if (options?.prompt) {
        params.append('prompt', options.prompt);
      }

      if (options?.loginHint) {
        params.append('login_hint', options.loginHint);
      }

      // Provider-specific parameters
      if (provider === 'google') {
        params.append('access_type', 'offline'); // Get refresh token
      }

      const redirectUrl = `${providerConfig.authorizationUrl}?${params.toString()}`;

      return {
        success: true,
        redirectUrl,
        state,
      };
    } catch (error) {
      console.error('Error generating OAuth URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate authorization URL',
      };
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(
    code: string,
    state: string,
    provider: string,
  ): Promise<{
    success: boolean;
    profile?: OAuthUserProfile;
    tokens?: {
      accessToken: string;
      refreshToken?: string;
      expiresIn?: number;
      idToken?: string;
    };
    error?: string;
    errorCode?: string;
  }> {
    try {
      // Validate state
      const stateData = this.stateStore.get(state);

      if (!stateData) {
        return {
          success: false,
          error: 'Invalid or expired state parameter',
          errorCode: 'INVALID_STATE',
        };
      }

      if (stateData.provider !== provider) {
        return {
          success: false,
          error: 'Provider mismatch',
          errorCode: 'PROVIDER_MISMATCH',
        };
      }

      // Check if state is too old (10 minutes)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        this.stateStore.delete(state);
        return {
          success: false,
          error: 'State expired',
          errorCode: 'STATE_EXPIRED',
        };
      }

      // Remove used state
      this.stateStore.delete(state);

      const providerConfig = this.providers.get(provider);

      if (!providerConfig) {
        return {
          success: false,
          error: `OAuth provider '${provider}' is not configured`,
          errorCode: 'PROVIDER_NOT_CONFIGURED',
        };
      }

      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(
        code,
        providerConfig,
        stateData.codeVerifier,
      );

      if (!tokenResponse.success || !tokenResponse.accessToken) {
        return {
          success: false,
          error: tokenResponse.error || 'Failed to exchange code for tokens',
          errorCode: 'TOKEN_EXCHANGE_FAILED',
        };
      }

      // Fetch user profile
      const profile = await this.fetchUserProfile(
        tokenResponse.accessToken,
        providerConfig,
      );

      if (!profile) {
        return {
          success: false,
          error: 'Failed to fetch user profile',
          errorCode: 'PROFILE_FETCH_FAILED',
        };
      }

      return {
        success: true,
        profile,
        tokens: {
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          expiresIn: tokenResponse.expiresIn,
          idToken: tokenResponse.idToken,
        },
      };
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth callback failed',
        errorCode: 'CALLBACK_ERROR',
      };
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    provider: OAuthProvider,
    codeVerifier: string,
  ): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    idToken?: string;
    error?: string;
  }> {
    try {
      const params = new URLSearchParams({
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        code,
        redirect_uri: provider.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      });

      const response = await axios.post(provider.tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });

      return {
        success: true,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        idToken: response.data.id_token,
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed',
      };
    }
  }

  /**
   * Fetch user profile from OAuth provider
   */
  private async fetchUserProfile(
    accessToken: string,
    provider: OAuthProvider,
  ): Promise<OAuthUserProfile | null> {
    try {
      const response = await axios.get(provider.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      // Normalize profile based on provider
      return this.normalizeProfile(response.data, provider.name);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Normalize user profile from different providers
   */
  private normalizeProfile(data: any, provider: string): OAuthUserProfile {
    switch (provider) {
      case 'google':
        return {
          id: data.id,
          email: data.email,
          emailVerified: data.verified_email || false,
          name: data.name,
          firstName: data.given_name,
          lastName: data.family_name,
          picture: data.picture,
          locale: data.locale,
        };

      case 'github':
        return {
          id: data.id.toString(),
          email: data.email,
          emailVerified: true, // GitHub emails are pre-verified
          name: data.name,
          firstName: data.name?.split(' ')[0],
          lastName: data.name?.split(' ').slice(1).join(' '),
          picture: data.avatar_url,
          locale: 'en',
        };

      case 'microsoft':
        return {
          id: data.id,
          email: data.mail || data.userPrincipalName,
          emailVerified: true,
          name: data.displayName,
          firstName: data.givenName,
          lastName: data.surname,
          picture: data.photo,
          locale: data.preferredLanguage,
        };

      case 'facebook':
        return {
          id: data.id,
          email: data.email,
          emailVerified: true,
          name: data.name,
          firstName: data.first_name,
          lastName: data.last_name,
          picture: data.picture?.data?.url,
          locale: data.locale,
        };

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Link OAuth account to existing user
   */
  async linkOAuthAccount(
    userId: string,
    provider: string,
    oauthData: {
      providerAccountId: string;
      accessToken: string;
      refreshToken?: string;
      expiresIn?: number;
      scope?: string;
      idToken?: string;
    },
  ): Promise<{
    success: boolean;
    accountId?: string;
    error?: string;
  }> {
    const client = await phoenixPool.connect();

    try {
      await client.query('BEGIN');

      // Check if OAuth account is already linked
      const existingLink = await client.query(
        `SELECT id, user_id FROM oauth_accounts 
         WHERE provider = $1 AND provider_account_id = $2`,
        [provider, oauthData.providerAccountId],
      );

      if (existingLink.rows.length > 0) {
        const existing = existingLink.rows[0];

        if (existing.user_id !== userId) {
          await client.query('ROLLBACK');
          return {
            success: false,
            error: 'This OAuth account is already linked to another user',
          };
        }

        // Update existing link
        await client.query(
          `UPDATE oauth_accounts 
           SET access_token = $1, 
               refresh_token = $2, 
               expires_at = $3,
               scope = $4,
               id_token = $5,
               updated_at = NOW()
           WHERE id = $6`,
          [
            oauthData.accessToken,
            oauthData.refreshToken,
            oauthData.expiresIn ? new Date(Date.now() + oauthData.expiresIn * 1000) : null,
            oauthData.scope,
            oauthData.idToken,
            existing.id,
          ],
        );

        await client.query('COMMIT');

        return {
          success: true,
          accountId: existing.id,
        };
      }

      // Create new OAuth account link
      const result = await client.query(
        `INSERT INTO oauth_accounts (
          user_id, provider, provider_account_id, access_token, 
          refresh_token, expires_at, scope, token_type, id_token
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
          userId,
          provider,
          oauthData.providerAccountId,
          oauthData.accessToken,
          oauthData.refreshToken,
          oauthData.expiresIn ? new Date(Date.now() + oauthData.expiresIn * 1000) : null,
          oauthData.scope,
          'Bearer',
          oauthData.idToken,
        ],
      );

      await client.query('COMMIT');

      return {
        success: true,
        accountId: result.rows[0].id,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error linking OAuth account:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to link OAuth account',
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get OAuth accounts linked to user
   */
  async getUserOAuthAccounts(userId: string): Promise<{
    success: boolean;
    accounts?: Array<{
      id: string;
      provider: string;
      providerAccountId: string;
      createdAt: Date;
      isExpired: boolean;
    }>;
    error?: string;
  }> {
    try {
      const result = await phoenixPool.query(
        `SELECT id, provider, provider_account_id, created_at, expires_at
         FROM oauth_accounts
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId],
      );

      const accounts = result.rows.map(row => ({
        id: row.id,
        provider: row.provider,
        providerAccountId: row.provider_account_id,
        createdAt: row.created_at,
        isExpired: row.expires_at ? new Date(row.expires_at) < new Date() : false,
      }));

      return {
        success: true,
        accounts,
      };
    } catch (error) {
      console.error('Error fetching OAuth accounts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch OAuth accounts',
      };
    }
  }

  /**
   * Unlink OAuth account from user
   */
  async unlinkOAuthAccount(
    userId: string,
    accountId: string,
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      // Verify ownership
      const result = await phoenixPool.query(
        `DELETE FROM oauth_accounts
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [accountId, userId],
      );

      if (result.rowCount === 0) {
        return {
          success: false,
          error: 'OAuth account not found or access denied',
        };
      }

      return {
        success: true,
        message: 'OAuth account unlinked successfully',
      };
    } catch (error) {
      console.error('Error unlinking OAuth account:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unlink OAuth account',
      };
    }
  }

  /**
   * Refresh OAuth access token
   */
  async refreshAccessToken(
    accountId: string,
  ): Promise<{
    success: boolean;
    accessToken?: string;
    expiresIn?: number;
    error?: string;
  }> {
    try {
      // Get account details
      const accountResult = await phoenixPool.query(
        `SELECT provider, refresh_token FROM oauth_accounts WHERE id = $1`,
        [accountId],
      );

      if (accountResult.rows.length === 0) {
        return {
          success: false,
          error: 'OAuth account not found',
        };
      }

      const { provider, refresh_token } = accountResult.rows[0];

      if (!refresh_token) {
        return {
          success: false,
          error: 'No refresh token available',
        };
      }

      const providerConfig = this.providers.get(provider);

      if (!providerConfig) {
        return {
          success: false,
          error: 'Provider not configured',
        };
      }

      // Request new access token
      const params = new URLSearchParams({
        client_id: providerConfig.clientId,
        client_secret: providerConfig.clientSecret,
        refresh_token,
        grant_type: 'refresh_token',
      });

      const response = await axios.post(providerConfig.tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });

      const { access_token, expires_in, refresh_token: new_refresh_token } = response.data;

      // Update stored tokens
      await phoenixPool.query(
        `UPDATE oauth_accounts 
         SET access_token = $1, 
             refresh_token = COALESCE($2, refresh_token),
             expires_at = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [
          access_token,
          new_refresh_token,
          expires_in ? new Date(Date.now() + expires_in * 1000) : null,
          accountId,
        ],
      );

      return {
        success: true,
        accessToken: access_token,
        expiresIn: expires_in,
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh access token',
      };
    }
  }

  /**
   * Cleanup expired states
   */
  private startCleanupTask(): void {
    setInterval(() => {
      const now = Date.now();
      const timeout = 10 * 60 * 1000; // 10 minutes

      for (const [state, data] of this.stateStore.entries()) {
        if (now - data.timestamp > timeout) {
          this.stateStore.delete(state);
        }
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Get available OAuth providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if provider is configured
   */
  isProviderConfigured(provider: string): boolean {
    return this.providers.has(provider);
  }
}

// Export singleton instance
export const oauthService = new OAuthService();
