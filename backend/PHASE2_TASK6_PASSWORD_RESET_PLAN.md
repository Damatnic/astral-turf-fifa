# Phase 2 - Task #6: Password Reset Flow

## Overview

Implement a secure password reset system that allows users to reset their passwords via email when they forget them. This builds on the email verification infrastructure from Task #5.

## Goals

1. **Forgot Password Endpoint** - Request password reset email
2. **Reset Token Generation** - Secure, time-limited tokens
3. **Password Reset Email** - Professional email with reset link
4. **Reset Password Endpoint** - Validate token and update password
5. **Security Features** - Rate limiting, token expiration, one-time use

## Implementation Plan

### Step 1: Create Password Reset DTOs

**forgot-password.dto.ts:**
```typescript
export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

**reset-password.dto.ts:**
```typescript
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
  newPassword: string;
}
```

### Step 2: Create Password Reset Email Template

**password-reset-email.hbs:**
- Professional design matching verification email
- Clear reset password button
- Security warnings
- Token expiration notice (1 hour)
- "Didn't request this?" message

### Step 3: Add Password Reset Methods to AuthService

**forgotPassword(email: string):**
1. Find user by email
2. Generate reset token (crypto.randomBytes)
3. Hash token before storage
4. Set 1-hour expiration
5. Send password reset email
6. Return generic success message (don't reveal if email exists)

**resetPassword(token: string, newPassword: string):**
1. Find user with valid, non-expired reset token
2. Verify token matches (bcrypt.compare)
3. Hash new password
4. Update user password
5. Clear reset token and expiration
6. Invalidate all existing sessions (force re-login)
7. Send password changed confirmation email
8. Return success message

### Step 4: Add Password Reset Endpoints to AuthController

**POST /api/auth/forgot-password**
- Rate limited: 3 requests per 15 minutes per IP
- Accepts email address
- Generic response for security
- Logs detailed errors server-side

**POST /api/auth/reset-password**
- Rate limited: 5 requests per 15 minutes per IP
- Accepts token and new password
- Validates token and expiration
- Updates password and clears token
- Returns success message

### Step 5: Create Password Changed Confirmation Email

**password-changed-email.hbs:**
- Notify user of password change
- Security alert if user didn't request change
- Contact support link
- Login button

### Step 6: Session Invalidation

When password is reset:
1. Delete all user's sessions from database
2. Blacklist all active access tokens (if Redis available)
3. Force user to log in with new password

### Step 7: Testing

**Manual Testing:**
```powershell
# 1. Request password reset
$forgotBody = @{ email = "coach@astralturf.com" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3333/api/auth/forgot-password" `
  -Method POST -Body $forgotBody -ContentType "application/json"

# Check email for reset link

# 2. Reset password with token
$resetBody = @{
  token = "token-from-email"
  newPassword = "NewSecure123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3333/api/auth/reset-password" `
  -Method POST -Body $resetBody -ContentType "application/json"

# 3. Verify old sessions are invalidated
# Try to use old access token - should fail

# 4. Login with new password
$loginBody = @{
  email = "coach@astralturf.com"
  password = "NewSecure123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3333/api/auth/login" `
  -Method POST -Body $loginBody -ContentType "application/json"
```

## Security Considerations

1. **Token Security:**
   - 64-character secure random tokens
   - Hashed storage (bcrypt)
   - 1-hour expiration (shorter than email verification)
   - One-time use (deleted after successful reset)

2. **Rate Limiting:**
   - Forgot password: 3 requests / 15 minutes
   - Reset password: 5 requests / 15 minutes
   - Prevent brute force attacks

3. **Privacy:**
   - Generic responses (don't reveal if email exists)
   - Log detailed errors server-side only
   - No user enumeration possible

4. **Session Security:**
   - Invalidate all sessions on password change
   - Force re-authentication
   - Blacklist active tokens (if Redis available)

5. **Email Security:**
   - Send confirmation email after password change
   - Include security warning if user didn't request change
   - Provide support contact

## Database Schema

Already implemented in Task #5:
```sql
ALTER TABLE users ADD COLUMN "password_reset_token" varchar(255);
ALTER TABLE users ADD COLUMN "password_reset_expires" timestamp;
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);
```

## File Structure

```
backend/src/
├── mail/
│   ├── templates/
│   │   └── password-reset-email.hbs       # NEW
│   │   └── password-changed-email.hbs     # NEW
│   └── mail.service.ts                    # MODIFIED - Add reset email method
├── auth/
│   ├── dto/
│   │   ├── forgot-password.dto.ts         # NEW
│   │   └── reset-password.dto.ts          # NEW
│   ├── auth.service.ts                    # MODIFIED - Add reset methods
│   └── auth.controller.ts                 # MODIFIED - Add reset endpoints
└── users/
    └── users.service.ts                   # MODIFIED - Add deleteAllSessions
```

## API Documentation

### POST /api/auth/forgot-password

Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Rate Limit:** 3 requests per 15 minutes per IP

### POST /api/auth/reset-password

Reset password with token.

**Request Body:**
```json
{
  "token": "64-character-hex-token",
  "newPassword": "NewSecure123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been reset successfully. Please log in with your new password."
}
```

**Errors:**
- 400 Bad Request: Invalid or expired token
- 400 Bad Request: Password doesn't meet requirements
- 429 Too Many Requests: Rate limit exceeded

**Rate Limit:** 5 requests per 15 minutes per IP

## Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number or special character

## Email Flow

1. **User requests reset:**
   - User enters email on forgot password page
   - POST /api/auth/forgot-password

2. **Email sent:**
   - User receives password reset email
   - Email contains reset link with token
   - Token valid for 1 hour

3. **User clicks link:**
   - Redirects to frontend: /reset-password?token=xxx
   - Frontend shows new password form

4. **User submits new password:**
   - POST /api/auth/reset-password
   - Password validated and updated
   - All sessions invalidated

5. **Confirmation email:**
   - User receives password changed email
   - Security notification

6. **User logs in:**
   - Must use new password
   - Previous sessions no longer valid

## Frontend Integration

**Forgot Password Page:**
```typescript
// /forgot-password
const handleForgotPassword = async (email: string) => {
  await api.post('/auth/forgot-password', { email });
  // Show: "Check your email for reset instructions"
  // Start 15-minute countdown before allowing resend
};
```

**Reset Password Page:**
```typescript
// /reset-password?token=xxx
const handleResetPassword = async (token: string, newPassword: string) => {
  await api.post('/auth/reset-password', { token, newPassword });
  // Show: "Password reset successful!"
  // Redirect to login page
};
```

**Password Requirements UI:**
- Show requirements before user types
- Real-time validation as user types
- Green checkmarks for met requirements
- Red X for unmet requirements

## Testing Scenarios

1. ✅ Request reset for existing email → Email sent
2. ✅ Request reset for non-existing email → Generic response
3. ✅ Reset with valid token → Password updated
4. ✅ Reset with expired token → Error
5. ✅ Reset with used token → Error
6. ✅ Reset with invalid token → Error
7. ✅ Old sessions invalidated → Must re-login
8. ✅ Confirmation email sent → User notified
9. ✅ Rate limiting works → Max 3 requests / 15 min
10. ✅ Password requirements enforced → Validation errors

## Expected Outcomes

✅ **Forgot Password Endpoint** - Sends reset email  
✅ **Password Reset Email** - Professional design  
✅ **Reset Password Endpoint** - Updates password  
✅ **Session Invalidation** - All sessions cleared  
✅ **Confirmation Email** - Password changed notification  
✅ **Rate Limiting** - Prevents abuse  
✅ **Security** - Tokens hashed, one-time use  
✅ **Testing** - All scenarios pass  

## Success Criteria

- [ ] Password reset email template created
- [ ] Password changed email template created
- [ ] Forgot password endpoint working
- [ ] Reset password endpoint working
- [ ] Password validation enforced
- [ ] Sessions invalidated on reset
- [ ] Confirmation emails sent
- [ ] Rate limiting applied
- [ ] All tests passing
- [ ] Documentation updated

## Timeline Estimate

- **Email Templates:** ~15 minutes
- **DTOs:** ~10 minutes
- **AuthService Methods:** ~30 minutes
- **Controller Endpoints:** ~15 minutes
- **Session Invalidation:** ~15 minutes
- **Testing:** ~20 minutes
- **Documentation:** ~15 minutes

**Total:** ~2 hours

---

**Status:** Ready to implement  
**Priority:** High  
**Dependencies:** Task #5 Email Verification (Complete ✅)  
**Blocks:** None (Phase 2 completion)

## Next Steps After Completion

With Task #6 complete, Phase 2 will be 100% finished:
- ✅ Task #3: RBAC System
- ✅ Task #4: Redis Session Store
- ✅ Task #5: Email Verification
- ✅ Task #6: Password Reset

**Phase 2: Backend Core Features - COMPLETE! 🎉**

Ready to move to Phase 3 or other priorities.
