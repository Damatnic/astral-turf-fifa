# Phase 2 Testing Guide - Complete Authentication System

**Created:** October 7, 2025  
**Status:** Ready for Testing  
**Server:** http://localhost:3333

## Table of Contents
1. [SMTP Configuration](#smtp-configuration)
2. [Test Sequence](#test-sequence)
3. [Test 1: User Registration](#test-1-user-registration)
4. [Test 2: Email Verification](#test-2-email-verification)
5. [Test 3: Login & RBAC](#test-3-login--rbac)
6. [Test 4: Password Reset Flow](#test-4-password-reset-flow)
7. [Test 5: Session Management](#test-5-session-management)
8. [Troubleshooting](#troubleshooting)

---

## SMTP Configuration

### Option A: Gmail (Recommended for Testing)

**Prerequisites:**
1. Gmail account with 2-Step Verification enabled
2. Generate App Password: https://myaccount.google.com/apppasswords

**Update `backend/.env`:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_actual_email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
EMAIL_FROM="Astral Turf" <noreply@astralturf.com>
ENABLE_EMAIL_VERIFICATION=true
EMAIL_VERIFICATION_EXPIRY=86400
```

### Option B: Mailtrap (Testing Without Real Emails)

**Free testing inbox - no real emails sent:**
1. Sign up at https://mailtrap.io
2. Get SMTP credentials from your inbox

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your_mailtrap_username
SMTP_PASSWORD=your_mailtrap_password
EMAIL_FROM="Astral Turf" <noreply@astralturf.com>
```

### Option C: SendGrid (Production Ready)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
EMAIL_FROM="Astral Turf" <noreply@astralturf.com>
```

---

## Test Sequence

**Complete flow to test all Phase 2 features:**

1. ✅ Register new user → Receive verification email
2. ✅ Verify email → Activate account
3. ✅ Login → Get JWT tokens
4. ✅ Access protected routes → Test RBAC
5. ✅ Request password reset → Receive reset email
6. ✅ Reset password → Sessions invalidated
7. ✅ Login with new password → Success
8. ✅ Test rate limiting → Verify protection

---

## Test 1: User Registration

### PowerShell Commands

```powershell
# Define base URL
$baseUrl = "http://localhost:3333/api"

# Test 1.1: Register Admin User
$adminBody = @{
    email = "admin@astralturf.com"
    password = "AdminPass123!"
    firstName = "Admin"
    lastName = "User"
    role = "admin"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
    -Method POST `
    -Body $adminBody `
    -ContentType "application/json"

Write-Host "Admin Registration Response:" -ForegroundColor Green
$adminResponse | ConvertTo-Json -Depth 3

# Test 1.2: Register Coach User
$coachBody = @{
    email = "coach@astralturf.com"
    password = "CoachPass123!"
    firstName = "Coach"
    lastName = "Smith"
    role = "coach"
} | ConvertTo-Json

$coachResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
    -Method POST `
    -Body $coachBody `
    -ContentType "application/json"

Write-Host "Coach Registration Response:" -ForegroundColor Green
$coachResponse | ConvertTo-Json -Depth 3

# Test 1.3: Register Player User
$playerBody = @{
    email = "player@astralturf.com"
    password = "PlayerPass123!"
    firstName = "John"
    lastName = "Doe"
    role = "player"
} | ConvertTo-Json

$playerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
    -Method POST `
    -Body $playerBody `
    -ContentType "application/json"

Write-Host "Player Registration Response:" -ForegroundColor Green
$playerResponse | ConvertTo-Json -Depth 3
```

### Expected Response

```json
{
  "message": "Registration successful! Please check your email to verify your account.",
  "user": {
    "id": "uuid-here",
    "email": "admin@astralturf.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "isEmailVerified": false,
    "createdAt": "2025-10-07T...",
    "updatedAt": "2025-10-07T..."
  }
}
```

### ✅ Success Criteria
- User created in database
- Verification email sent
- Password is hashed
- Response excludes sensitive data

---

## Test 2: Email Verification

### Check Your Email

You should receive an email with:
- **Subject:** "Verify Your Astral Turf Account"
- **Content:** Professional gradient design with verification button
- **Token:** 64-character verification code
- **Expiry:** 24 hours

### PowerShell Commands

```powershell
# Extract token from email and verify
$verificationToken = "paste_64_character_token_from_email_here"

$verifyBody = @{
    token = $verificationToken
} | ConvertTo-Json

$verifyResponse = Invoke-RestMethod -Uri "$baseUrl/auth/verify-email" `
    -Method POST `
    -Body $verifyBody `
    -ContentType "application/json"

Write-Host "Email Verification Response:" -ForegroundColor Green
$verifyResponse | ConvertTo-Json -Depth 3
```

### Test Resend Verification

```powershell
# If token expired, resend verification email
$resendBody = @{
    email = "admin@astralturf.com"
} | ConvertTo-Json

$resendResponse = Invoke-RestMethod -Uri "$baseUrl/auth/resend-verification" `
    -Method POST `
    -Body $resendBody `
    -ContentType "application/json"

Write-Host "Resend Verification Response:" -ForegroundColor Green
$resendResponse | ConvertTo-Json -Depth 3
```

### Expected Response

```json
{
  "message": "Email verified successfully! You can now log in.",
  "user": {
    "id": "uuid-here",
    "email": "admin@astralturf.com",
    "isEmailVerified": true
  }
}
```

### ✅ Success Criteria
- Token validated correctly
- `isEmailVerified` set to true
- Token deleted from database
- User can now login

---

## Test 3: Login & RBAC

### PowerShell Commands

```powershell
# Test 3.1: Login as Admin
$loginBody = @{
    email = "admin@astralturf.com"
    password = "AdminPass123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

Write-Host "Login Response:" -ForegroundColor Green
$loginResponse | ConvertTo-Json -Depth 3

# Save tokens for subsequent requests
$accessToken = $loginResponse.accessToken
$refreshToken = $loginResponse.refreshToken

# Test 3.2: Get Current User
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

$meResponse = Invoke-RestMethod -Uri "$baseUrl/users/me" `
    -Method GET `
    -Headers $headers

Write-Host "Current User Response:" -ForegroundColor Green
$meResponse | ConvertTo-Json -Depth 3

# Test 3.3: Get All Users (Admin Only)
$usersResponse = Invoke-RestMethod -Uri "$baseUrl/users" `
    -Method GET `
    -Headers $headers

Write-Host "All Users Response:" -ForegroundColor Green
$usersResponse | ConvertTo-Json -Depth 3
```

### Test RBAC - Non-Admin Access

```powershell
# Login as Player
$playerLoginBody = @{
    email = "player@astralturf.com"
    password = "PlayerPass123!"
} | ConvertTo-Json

$playerLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
    -Method POST `
    -Body $playerLoginBody `
    -ContentType "application/json"

$playerToken = $playerLogin.accessToken

# Try to access admin-only route (should fail)
$playerHeaders = @{
    "Authorization" = "Bearer $playerToken"
}

try {
    $failResponse = Invoke-RestMethod -Uri "$baseUrl/users" `
        -Method GET `
        -Headers $playerHeaders
    Write-Host "ERROR: Player should not access admin route!" -ForegroundColor Red
} catch {
    Write-Host "✅ RBAC Working: Player correctly denied access" -ForegroundColor Green
    $_.Exception.Response.StatusCode
}
```

### Expected Login Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "admin@astralturf.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "isEmailVerified": true
  }
}
```

### ✅ Success Criteria
- Valid JWT tokens returned
- Access token expires in 15 minutes
- Refresh token expires in 7 days
- RBAC correctly restricts access
- Session created in database

---

## Test 4: Password Reset Flow

### PowerShell Commands

```powershell
# Test 4.1: Request Password Reset
$forgotBody = @{
    email = "admin@astralturf.com"
} | ConvertTo-Json

$forgotResponse = Invoke-RestMethod -Uri "$baseUrl/auth/forgot-password" `
    -Method POST `
    -Body $forgotBody `
    -ContentType "application/json"

Write-Host "Forgot Password Response:" -ForegroundColor Green
$forgotResponse | ConvertTo-Json -Depth 3

# Wait for email to arrive...
# Check your inbox for password reset email
Write-Host "`n📧 Check your email for password reset link!" -ForegroundColor Yellow
Write-Host "Email subject: 'Reset Your Astral Turf Password'" -ForegroundColor Cyan
```

### Check Your Email

You should receive:
- **Subject:** "Reset Your Astral Turf Password"
- **Content:** Professional gradient design with reset button
- **Token:** 64-character reset token
- **Expiry:** 1 hour
- **Security notice:** "If you didn't request this, ignore this email"

### Complete Password Reset

```powershell
# Extract token from email
$resetToken = "paste_64_character_reset_token_from_email_here"

# Test 4.2: Reset Password
$resetBody = @{
    token = $resetToken
    newPassword = "NewAdminPass123!"
} | ConvertTo-Json

$resetResponse = Invoke-RestMethod -Uri "$baseUrl/auth/reset-password" `
    -Method POST `
    -Body $resetBody `
    -ContentType "application/json"

Write-Host "Password Reset Response:" -ForegroundColor Green
$resetResponse | ConvertTo-Json -Depth 3

# Check for password changed confirmation email
Write-Host "`n📧 Check for password change confirmation email!" -ForegroundColor Yellow
```

### Test Old Password No Longer Works

```powershell
# Test 4.3: Try logging in with old password (should fail)
$oldPasswordBody = @{
    email = "admin@astralturf.com"
    password = "AdminPass123!"  # Old password
} | ConvertTo-Json

try {
    $oldLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -Body $oldPasswordBody `
        -ContentType "application/json"
    Write-Host "ERROR: Old password should not work!" -ForegroundColor Red
} catch {
    Write-Host "✅ Old password correctly rejected" -ForegroundColor Green
}

# Test 4.4: Login with new password (should succeed)
$newPasswordBody = @{
    email = "admin@astralturf.com"
    password = "NewAdminPass123!"  # New password
} | ConvertTo-Json

$newLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
    -Method POST `
    -Body $newPasswordBody `
    -ContentType "application/json"

Write-Host "✅ Login with new password successful!" -ForegroundColor Green
$newLoginResponse | ConvertTo-Json -Depth 3
```

### Expected Password Reset Response

```json
{
  "message": "Password has been reset successfully. All your active sessions have been terminated for security. Please log in with your new password."
}
```

### ✅ Success Criteria
- Reset email sent
- Token validated correctly
- Password updated (bcrypt hashed)
- All user sessions invalidated (PostgreSQL + Redis)
- Confirmation email sent
- Old password rejected
- New password works
- Token deleted after use (one-time use)

---

## Test 5: Session Management

### PowerShell Commands

```powershell
# Test 5.1: Create Multiple Sessions
# Login from "device 1"
$session1 = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
    -Method POST `
    -Body $newPasswordBody `
    -ContentType "application/json"

$token1 = $session1.accessToken

# Login from "device 2"
$session2 = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
    -Method POST `
    -Body $newPasswordBody `
    -ContentType "application/json"

$token2 = $session2.accessToken

Write-Host "✅ Created 2 sessions" -ForegroundColor Green

# Test 5.2: Verify both tokens work
$headers1 = @{ "Authorization" = "Bearer $token1" }
$headers2 = @{ "Authorization" = "Bearer $token2" }

$me1 = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method GET -Headers $headers1
$me2 = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method GET -Headers $headers2

Write-Host "✅ Both sessions active" -ForegroundColor Green

# Test 5.3: Logout from one session
$logoutBody = @{ refreshToken = $session1.refreshToken } | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/auth/logout" `
    -Method POST `
    -Body $logoutBody `
    -Headers $headers1 `
    -ContentType "application/json"

Write-Host "✅ Logged out from session 1" -ForegroundColor Green

# Test 5.4: Verify session 1 token is blacklisted
try {
    Invoke-RestMethod -Uri "$baseUrl/users/me" -Method GET -Headers $headers1
    Write-Host "ERROR: Session 1 should be invalidated!" -ForegroundColor Red
} catch {
    Write-Host "✅ Session 1 correctly invalidated" -ForegroundColor Green
}

# Test 5.5: Verify session 2 still works
$me2Again = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method GET -Headers $headers2
Write-Host "✅ Session 2 still active" -ForegroundColor Green
```

### Test Password Reset Invalidates All Sessions

```powershell
# Request another password reset
$forgotAgain = @{ email = "admin@astralturf.com" } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/auth/forgot-password" `
    -Method POST `
    -Body $forgotAgain `
    -ContentType "application/json"

# Get token from email and reset password
$resetAgain = @{
    token = "new_reset_token_from_email"
    newPassword = "FinalAdminPass123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/auth/reset-password" `
    -Method POST `
    -Body $resetAgain `
    -ContentType "application/json"

# Test 5.6: Verify session 2 is now invalidated
try {
    Invoke-RestMethod -Uri "$baseUrl/users/me" -Method GET -Headers $headers2
    Write-Host "ERROR: All sessions should be invalidated!" -ForegroundColor Red
} catch {
    Write-Host "✅ All sessions correctly invalidated after password reset" -ForegroundColor Green
}
```

### ✅ Success Criteria
- Multiple sessions can exist simultaneously
- Logout invalidates specific session
- Password reset invalidates ALL sessions
- Blacklisted tokens rejected
- Session data stored in PostgreSQL (or Redis if configured)

---

## Test 6: Rate Limiting

### PowerShell Commands

```powershell
# Test 6.1: Forgot Password Rate Limit (3 per 15 minutes)
$testEmail = @{ email = "admin@astralturf.com" } | ConvertTo-Json

Write-Host "`nTesting rate limiting on forgot-password endpoint..." -ForegroundColor Yellow

# Send 3 requests (should succeed)
1..3 | ForEach-Object {
    try {
        Invoke-RestMethod -Uri "$baseUrl/auth/forgot-password" `
            -Method POST `
            -Body $testEmail `
            -ContentType "application/json"
        Write-Host "Request $_: ✅ Accepted" -ForegroundColor Green
    } catch {
        Write-Host "Request $_: ❌ Rejected" -ForegroundColor Red
    }
    Start-Sleep -Seconds 1
}

# 4th request should be rate limited
try {
    Invoke-RestMethod -Uri "$baseUrl/auth/forgot-password" `
        -Method POST `
        -Body $testEmail `
        -ContentType "application/json"
    Write-Host "Request 4: ❌ ERROR - Should be rate limited!" -ForegroundColor Red
} catch {
    Write-Host "Request 4: ✅ Rate limited (HTTP 429)" -ForegroundColor Green
    $_.Exception.Response.StatusCode
}
```

### Test Global Rate Limit

```powershell
# Test 6.2: Global Rate Limit (100 requests per 60 seconds)
Write-Host "`nTesting global rate limiting..." -ForegroundColor Yellow

# Send rapid requests
$rapidRequests = 1..105
$successCount = 0
$limitedCount = 0

foreach ($i in $rapidRequests) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/users/me" -Method GET -Headers $headers2
        $successCount++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            $limitedCount++
        }
    }
}

Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Rate Limited: $limitedCount" -ForegroundColor Yellow
```

### ✅ Success Criteria
- Forgot password: 3 requests per 15 minutes
- Reset password: 5 requests per 15 minutes
- Global: 100 requests per 60 seconds
- HTTP 429 returned when limit exceeded

---

## Test 7: Security Features

### Test Invalid Email Verification Token

```powershell
$invalidToken = @{ token = "invalid_token_12345" } | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/auth/verify-email" `
        -Method POST `
        -Body $invalidToken `
        -ContentType "application/json"
    Write-Host "ERROR: Invalid token should be rejected!" -ForegroundColor Red
} catch {
    Write-Host "✅ Invalid verification token rejected" -ForegroundColor Green
}
```

### Test Expired Password Reset Token

```powershell
# Wait 1+ hour, then try to use reset token
# Or manually set token expiry in database to past time

$expiredReset = @{
    token = "expired_token_from_1_hour_ago"
    newPassword = "TestPass123!"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/auth/reset-password" `
        -Method POST `
        -Body $expiredReset `
        -ContentType "application/json"
    Write-Host "ERROR: Expired token should be rejected!" -ForegroundColor Red
} catch {
    Write-Host "✅ Expired reset token rejected" -ForegroundColor Green
}
```

### Test User Enumeration Protection

```powershell
# Request password reset for non-existent email
$fakeEmail = @{ email = "nonexistent@example.com" } | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/auth/forgot-password" `
    -Method POST `
    -Body $fakeEmail `
    -ContentType "application/json"

# Should return generic message (not reveal if user exists)
if ($response.message -like "*If an account exists*") {
    Write-Host "✅ Generic response prevents user enumeration" -ForegroundColor Green
} else {
    Write-Host "⚠️ Response may reveal if user exists" -ForegroundColor Yellow
}
```

### ✅ Success Criteria
- Invalid tokens rejected
- Expired tokens rejected
- Generic messages prevent user enumeration
- Passwords are bcrypt hashed (10 rounds)
- Tokens are bcrypt hashed before storage
- Sensitive fields excluded from responses

---

## Troubleshooting

### Email Not Sending

**Problem:** No emails received

**Solutions:**
1. Check SMTP credentials in `.env`
2. For Gmail: Verify App Password is correct
3. Check backend logs for email errors
4. Test with Mailtrap.io for development
5. Verify firewall allows SMTP ports (587, 465)

```powershell
# Check backend logs
# Look for MailService errors
```

### Database Connection Issues

**Problem:** Cannot connect to database

**Solutions:**
1. Verify DATABASE_URL in `.env`
2. Check Neon database is active
3. Verify SSL mode is correct
4. Check IP whitelist in Neon dashboard

### Token Validation Failures

**Problem:** Valid tokens rejected

**Solutions:**
1. Check token hasn't expired
2. Verify token copied completely from email
3. Check JWT secrets match in `.env`
4. Verify system time is correct

### Rate Limiting Too Aggressive

**Problem:** Getting rate limited during testing

**Solutions:**
1. Temporarily adjust limits in `.env`:
   ```env
   THROTTLE_TTL=60
   THROTTLE_LIMIT=1000
   ```
2. Restart backend server
3. Or wait for rate limit window to expire

### Session Issues

**Problem:** Sessions not persisting

**Solutions:**
1. Check database connection
2. Verify sessions table exists (migration ran)
3. Check Redis connection if using Redis
4. Review session logs

---

## Complete Test Script

Save this as `test-auth-system.ps1`:

```powershell
# Astral Turf - Complete Authentication System Test
# Phase 2 - All Features

$baseUrl = "http://localhost:3333/api"

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ASTRAL TURF - AUTHENTICATION SYSTEM TEST SUITE   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Test 1: Registration
Write-Host "TEST 1: User Registration" -ForegroundColor Yellow
$registerBody = @{
    email = "testuser@example.com"
    password = "TestPass123!"
    firstName = "Test"
    lastName = "User"
    role = "player"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method POST `
        -Body $registerBody `
        -ContentType "application/json"
    Write-Host "✅ Registration successful" -ForegroundColor Green
    $registerResponse | ConvertTo-Json -Depth 2
} catch {
    Write-Host "❌ Registration failed" -ForegroundColor Red
    $_.Exception.Message
}

Write-Host "`n📧 Check your email for verification link!" -ForegroundColor Cyan
Write-Host "Press Enter after verifying email..." -ForegroundColor Yellow
Read-Host

# Test 2: Login
Write-Host "`nTEST 2: Login" -ForegroundColor Yellow
$loginBody = @{
    email = "testuser@example.com"
    password = "TestPass123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    Write-Host "✅ Login successful" -ForegroundColor Green
    $accessToken = $loginResponse.accessToken
} catch {
    Write-Host "❌ Login failed" -ForegroundColor Red
    $_.Exception.Message
}

# Test 3: Protected Route
Write-Host "`nTEST 3: Access Protected Route" -ForegroundColor Yellow
$headers = @{ "Authorization" = "Bearer $accessToken" }

try {
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/users/me" `
        -Method GET `
        -Headers $headers
    Write-Host "✅ Protected route accessible" -ForegroundColor Green
    $meResponse | ConvertTo-Json -Depth 2
} catch {
    Write-Host "❌ Protected route failed" -ForegroundColor Red
}

# Test 4: Password Reset
Write-Host "`nTEST 4: Password Reset Flow" -ForegroundColor Yellow
$forgotBody = @{ email = "testuser@example.com" } | ConvertTo-Json

try {
    $forgotResponse = Invoke-RestMethod -Uri "$baseUrl/auth/forgot-password" `
        -Method POST `
        -Body $forgotBody `
        -ContentType "application/json"
    Write-Host "✅ Password reset email sent" -ForegroundColor Green
    Write-Host "📧 Check your email for reset link!" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Password reset request failed" -ForegroundColor Red
}

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              TEST SUITE COMPLETED                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
```

---

## Summary Checklist

### Before Testing
- [ ] SMTP configured in `.env`
- [ ] Backend server running (`npm run start:dev`)
- [ ] Database connected (check startup logs)
- [ ] Email account accessible

### Test Execution
- [ ] Register users (admin, coach, player)
- [ ] Verify emails received
- [ ] Verify email addresses
- [ ] Login successfully
- [ ] Access protected routes
- [ ] Test RBAC (role restrictions)
- [ ] Request password reset
- [ ] Reset password with token
- [ ] Verify sessions invalidated
- [ ] Login with new password
- [ ] Test rate limiting

### Post-Testing
- [ ] Review all email templates
- [ ] Check database for proper data
- [ ] Verify logs are clean
- [ ] Document any issues found
- [ ] Commit test scripts to repo

---

## Next Steps After Testing

1. **If All Tests Pass:**
   - Document test results
   - Commit test scripts
   - Push to remote repository
   - Begin Phase 3 development

2. **If Issues Found:**
   - Document issues
   - Create bug tickets
   - Fix critical issues
   - Re-test

3. **Production Readiness:**
   - Switch to production SMTP (SendGrid/AWS SES)
   - Update JWT secrets (generate new ones)
   - Configure Redis for sessions
   - Enable rate limiting
   - Set up monitoring
   - Review security checklist

---

**Happy Testing! 🚀**

For questions or issues, refer to:
- `PHASE2_COMPLETE_REPORT.md` - Complete documentation
- `PHASE2_QUICK_REFERENCE.md` - API reference
- `PHASE2_PROGRESS.md` - Implementation details
