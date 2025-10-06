# Phoenix API Authentication - Quick Setup Guide

## ✅ What's Been Completed

All code has been implemented! Here's what's ready:

### ✅ Service Layer (100% Complete)
- **OAuthService.ts** - OAuth 2.0 integration with Google, GitHub, Microsoft, Facebook
- **MFAService.ts** - TOTP-based MFA with QR codes and backup codes
- **SessionService.ts** - Advanced session management with device tracking
- **RBACService.ts** - Dynamic role and permission management

### ✅ API Layer (100% Complete)
- **11 new endpoints** added to PhoenixAPIServer.ts
- **11 wrapper methods** implemented
- **All routes configured** and ready to use

### ✅ Dependencies (100% Complete)
- **qrcode** package installed
- **@types/qrcode** TypeScript types installed

---

## 🚀 What You Need to Do

### Step 1: Apply Database Migration (5 minutes)

Run the migration to create all required tables:

```bash
# If using PostgreSQL locally
psql -U your_username -d astral_turf -f migrations/005_phoenix_authentication_complete.sql

# If using a remote database
psql -h your_host -U your_username -d astral_turf -f migrations/005_phoenix_authentication_complete.sql
```

**What this creates:**
- ✅ `oauth_accounts` table - Stores linked OAuth accounts
- ✅ `mfa_setups` table - Temporary MFA setup data
- ✅ `mfa_verification_attempts` table - Rate limiting for MFA
- ✅ `roles` table - System and custom roles (5 built-in roles)
- ✅ `permissions` table - Available permissions (17 base permissions)
- ✅ `system_logs` table - Audit trail for RBAC changes
- ✅ Adds columns to `users` table - MFA fields + permissions
- ✅ Adds columns to `user_sessions` table - Device tracking
- ✅ Creates cleanup function - `cleanup_expired_auth_data()`

---

### Step 2: Setup OAuth Providers (20 minutes)

You need to configure OAuth apps for each provider you want to support:

#### Option 1: Google OAuth (Recommended - Most Popular)

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Create Project**: "Astral Turf" (or use existing)
3. **Enable APIs**: 
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. **Create Credentials**:
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Astral Turf Auth"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/oauth/google/callback` (development)
     - `https://your-domain.com/api/auth/oauth/google/callback` (production)
5. **Copy credentials** to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth/google/callback
   ```

#### Option 2: GitHub OAuth (Popular with Developers)

1. **Go to**: GitHub Settings → Developer settings → OAuth Apps
2. **New OAuth App**:
   - Application name: `Astral Turf`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/oauth/github/callback`
3. **Copy credentials** to `.env`:
   ```env
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/oauth/github/callback
   ```

#### Option 3: Microsoft OAuth (For Enterprise)

1. **Go to**: [Azure Portal](https://portal.azure.com/)
2. **Navigate to**: "App registrations" → "New registration"
3. **Register app**:
   - Name: "Astral Turf"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `Web` → `http://localhost:3000/api/auth/oauth/microsoft/callback`
4. **Create secret**:
   - Go to "Certificates & secrets" → "New client secret"
   - Description: "Astral Turf Auth"
   - Copy the secret value immediately (shown only once)
5. **Copy credentials** to `.env`:
   ```env
   MICROSOFT_CLIENT_ID=your_application_client_id
   MICROSOFT_CLIENT_SECRET=your_client_secret
   MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/oauth/microsoft/callback
   ```

#### Option 4: Facebook OAuth (For Social Apps)

1. **Go to**: [Facebook Developers](https://developers.facebook.com/)
2. **Create App**:
   - App Type: "Consumer"
   - App Name: "Astral Turf"
3. **Add Facebook Login**:
   - Go to "Products" → Add "Facebook Login"
   - Settings → Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/oauth/facebook/callback`
4. **Copy credentials** to `.env`:
   ```env
   FACEBOOK_CLIENT_ID=your_facebook_app_id
   FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
   FACEBOOK_REDIRECT_URI=http://localhost:3000/api/auth/oauth/facebook/callback
   ```

---

### Step 3: Update Environment Variables (5 minutes)

Add these to your `.env` file:

```env
# ===========================================
# OAuth Configuration
# ===========================================

# Google OAuth (if using)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth/google/callback

# GitHub OAuth (if using)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/oauth/github/callback

# Microsoft OAuth (if using)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/oauth/microsoft/callback

# Facebook OAuth (if using)
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/auth/oauth/facebook/callback

# ===========================================
# MFA Configuration
# ===========================================
MFA_ISSUER=Astral Turf
MFA_ALGORITHM=SHA1
MFA_DIGITS=6
MFA_PERIOD=30

# ===========================================
# JWT Configuration (should already exist)
# ===========================================
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here_change_in_production
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# ===========================================
# Database (should already exist)
# ===========================================
DATABASE_URL=postgresql://username:password@localhost:5432/astral_turf
```

---

### Step 4: Test the Implementation (15 minutes)

#### Test 1: OAuth Flow (Google)

```bash
# Start your server
npm run dev

# Test OAuth initiation
curl http://localhost:3000/api/auth/oauth/google

# Expected response:
# {
#   "success": true,
#   "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
# }

# Open the authorizationUrl in a browser
# Complete the Google login
# You'll be redirected back to your callback URL
```

#### Test 2: MFA Setup

```bash
# First, login to get an access token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your_password"
  }'

# Save the access token from response
# Then setup MFA
curl -X POST http://localhost:3000/api/auth/mfa/setup \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected response includes:
# - qrCodeUrl (base64 data URL)
# - secret (for manual entry)
# - backupCodes (10 codes - save these!)

# Scan QR code with Google Authenticator app
# Enter the 6-digit code to verify setup
curl -X POST http://localhost:3000/api/auth/mfa/verify-setup \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'
```

#### Test 3: Session Management

```bash
# List all sessions
curl http://localhost:3000/api/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected response shows all active sessions with:
# - Device info (browser, OS)
# - IP address
# - Last activity
# - Current session marked

# Revoke a session
curl -X DELETE http://localhost:3000/api/auth/sessions/SESSION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Test 4: RBAC

```bash
# Assign role (requires admin token)
curl -X POST http://localhost:3000/api/auth/rbac/assign-role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "role": "coach"
  }'

# Grant permission
curl -X POST http://localhost:3000/api/auth/rbac/grant-permission \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "permission": "analytics:write"
  }'
```

---

## 📋 Production Checklist

Before deploying to production:

### Security
- [ ] Change all JWT secrets to strong random values
- [ ] Use HTTPS for all OAuth redirect URIs
- [ ] Enable rate limiting on authentication endpoints
- [ ] Set up monitoring for failed login attempts
- [ ] Configure CORS properly

### OAuth
- [ ] Update OAuth redirect URIs to production domain
- [ ] Test each OAuth provider in production environment
- [ ] Set up OAuth app verification (Google, Facebook require this)
- [ ] Configure OAuth scopes appropriately

### MFA
- [ ] Test MFA setup with multiple authenticator apps (Google Authenticator, Authy, Microsoft Authenticator)
- [ ] Ensure backup codes are stored securely
- [ ] Test MFA with time drift (±30 seconds)
- [ ] Set up MFA recovery process

### Database
- [ ] Apply migration to production database
- [ ] Set up automated cleanup (pg_cron or scheduled task)
- [ ] Configure database backups
- [ ] Test rollback procedure

### Monitoring
- [ ] Set up logging for authentication events
- [ ] Monitor OAuth callback errors
- [ ] Track MFA adoption rates
- [ ] Monitor session activity
- [ ] Alert on suspicious RBAC changes

---

## 🔧 Troubleshooting

### Issue: OAuth callback fails

**Check:**
1. Redirect URI matches exactly (including protocol, domain, path)
2. Client ID and secret are correct
3. OAuth app is enabled/published
4. User has granted required permissions

**Fix:**
```bash
# Check OAuth configuration
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_REDIRECT_URI

# Verify redirect URI in provider console matches exactly
```

### Issue: MFA QR code not generating

**Check:**
1. qrcode package is installed
2. User email is valid
3. Database has mfa_setups table

**Fix:**
```bash
# Reinstall qrcode
npm install qrcode @types/qrcode

# Check database
psql -d astral_turf -c "SELECT * FROM mfa_setups LIMIT 1;"
```

### Issue: Sessions not listing device info

**Check:**
1. user_sessions table has new columns
2. User-Agent header is being sent
3. IP address is being captured

**Fix:**
```sql
-- Check if columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_sessions' 
AND column_name IN ('device_fingerprint', 'user_agent', 'browser');

-- If missing, run migration again
```

### Issue: RBAC permission denied

**Check:**
1. User has correct role assigned
2. Role has required permissions
3. Admin user is making the request

**Fix:**
```sql
-- Check user role and permissions
SELECT id, email, role, permissions FROM users WHERE id = 'user-123';

-- Check role permissions
SELECT * FROM roles WHERE name = 'coach';

-- Grant permission manually if needed
UPDATE users SET permissions = '["analytics:write"]' WHERE id = 'user-123';
```

---

## 📚 Documentation Files

Created documentation:
- ✅ `PHOENIX_AUTHENTICATION_COMPLETE.md` - Comprehensive guide (100+ pages)
- ✅ `PHOENIX_AUTHENTICATION_SETUP.md` - This quick setup guide
- ✅ `migrations/005_phoenix_authentication_complete.sql` - Database migration

Existing documentation (updated):
- Service layer: Each service file has detailed JSDoc comments
- API endpoints: Documented in PHOENIX_AUTHENTICATION_COMPLETE.md

---

## 🎯 What's Next?

### Immediate (Required)
1. Apply database migration
2. Configure at least one OAuth provider (Google recommended)
3. Update .env file
4. Test OAuth flow
5. Test MFA setup

### Short-term (Recommended)
1. Set up automated session cleanup
2. Configure monitoring/logging
3. Test all authentication flows end-to-end
4. Set up MFA recovery process
5. Configure CORS for production

### Long-term (Optional)
1. Add more OAuth providers
2. Implement SMS-based 2FA
3. Add biometric authentication
4. Build admin dashboard for RBAC
5. Set up analytics for auth events

---

## 💡 Tips

### OAuth Tips
- **Start with Google** - easiest to set up, most users have accounts
- **Test in incognito** - ensures clean OAuth flow
- **Save state tokens** - needed for callback validation
- **Handle errors gracefully** - show user-friendly messages

### MFA Tips
- **Show backup codes once** - users must save them
- **Test with multiple apps** - Google Authenticator, Authy, Microsoft Authenticator
- **Provide clear instructions** - many users new to MFA
- **Allow MFA disable** - but require password confirmation

### Session Tips
- **Show device info** - helps users identify suspicious sessions
- **Allow revocation** - let users revoke other sessions
- **Track last activity** - show when session was last used
- **Cleanup regularly** - remove expired sessions daily

### RBAC Tips
- **Start with system roles** - don't create custom roles initially
- **Use wildcards carefully** - only for super_admin
- **Log all changes** - audit trail is critical
- **Test permissions** - ensure roles have correct access

---

## 📞 Support

For issues:
1. Check this setup guide first
2. Review PHOENIX_AUTHENTICATION_COMPLETE.md for detailed docs
3. Check service file comments for implementation details
4. Review system_logs table for audit trail
5. Check database migration output for errors

**Migration complete? Database ready? OAuth configured?**

**You're ready to go! 🚀**

---

**Last Updated**: January 2025  
**Status**: ✅ Ready for Production (after setup steps above)
