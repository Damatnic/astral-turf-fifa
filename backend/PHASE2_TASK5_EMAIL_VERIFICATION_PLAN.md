# Phase 2 - Task #5: Email Verification System

## Overview

Implement a comprehensive email verification system that ensures users verify their email addresses before gaining full access to the Astral Turf platform.

## Goals

1. **Email Service Integration** - Set up email sending capability
2. **Verification Tokens** - Generate secure, time-limited verification tokens
3. **Automated Emails** - Send verification emails upon registration
4. **Verification Endpoint** - Allow users to verify their email addresses
5. **Resend Functionality** - Enable users to request new verification emails
6. **Access Control** - Restrict certain features until email is verified

## Implementation Plan

### Step 1: Install Email Dependencies

```powershell
cd backend
npm install --save @nestjs-modules/mailer nodemailer
npm install --save-dev @types/nodemailer
```

**Packages:**
- `@nestjs-modules/mailer` - NestJS email module
- `nodemailer` - Email sending library
- `@types/nodemailer` - TypeScript types

### Step 2: Configure Email Service

Create `backend/src/mail/mail.module.ts`:
- Import MailerModule
- Configure email transport (SMTP/SendGrid/AWS SES)
- Set up email templates directory
- Configure default sender information

Create `backend/src/mail/mail.service.ts`:
- `sendVerificationEmail(email, token, userName)` - Send verification email
- `sendWelcomeEmail(email, userName)` - Send welcome email after verification
- `sendPasswordResetEmail(email, token, userName)` - For future password reset
- Email template helpers

### Step 3: Update User Entity

Modify `backend/src/users/entities/user.entity.ts`:
- Add `emailVerified: boolean` (default: false)
- Add `emailVerificationToken: string | null`
- Add `emailVerificationExpires: Date | null`

Create migration:
```bash
npm run migration:generate -- src/migrations/AddEmailVerification
npm run migration:run
```

### Step 4: Update Registration Flow

Modify `backend/src/auth/auth.service.ts`:

**register() method:**
1. Create user with `emailVerified = false`
2. Generate verification token (crypto.randomBytes)
3. Set token expiration (24 hours)
4. Save token to user record
5. Send verification email
6. Return success message

**generateVerificationToken():**
- Use crypto.randomBytes(32).toString('hex')
- Hash token before storing in database
- Store expiration time (24 hours from now)

### Step 5: Create Email Verification Endpoints

Create new endpoints in `backend/src/auth/auth.controller.ts`:

**POST /api/auth/verify-email**
- Request body: `{ token: string }`
- Validate token exists and not expired
- Mark user as verified
- Clear verification token
- Send welcome email
- Return success message

**POST /api/auth/resend-verification**
- Request body: `{ email: string }`
- Rate limit: 1 request per 5 minutes per email
- Find user by email
- Check if already verified
- Generate new token
- Send new verification email
- Return success message

**GET /api/auth/verify-email/:token** (Alternative)
- Click-to-verify link in email
- Redirect to frontend with success/error status

### Step 6: Implement Email Templates

Create HTML email templates in `backend/src/mail/templates/`:

**verification-email.hbs** (Handlebars template):
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Professional email styling */
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Astral Turf, {{userName}}!</h1>
    <p>Please verify your email address to complete your registration.</p>
    <a href="{{verificationUrl}}" class="button">Verify Email</a>
    <p>Or copy this link: {{verificationUrl}}</p>
    <p>This link expires in 24 hours.</p>
    <p>If you didn't register, please ignore this email.</p>
  </div>
</body>
</html>
```

**welcome-email.hbs**:
- Welcome message after verification
- Getting started guide
- Link to platform features

### Step 7: Environment Configuration

Add to `backend/.env.example`:
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM="Astral Turf <noreply@astralturf.com>"

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000

# Verification Settings
EMAIL_VERIFICATION_EXPIRY=86400  # 24 hours in seconds
```

**Email Service Options:**

1. **Gmail SMTP** (Development)
   - Use Gmail account with app password
   - Limit: 500 emails/day

2. **SendGrid** (Recommended for Production)
   - Free tier: 100 emails/day
   - Excellent deliverability
   - Easy setup

3. **AWS SES** (Production - High Volume)
   - Very cost-effective
   - Requires domain verification
   - Best for high volume

### Step 8: Add Verification Guards

Create `backend/src/auth/guards/email-verified.guard.ts`:
```typescript
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user?.emailVerified) {
      throw new ForbiddenException('Please verify your email address');
    }
    
    return true;
  }
}
```

Apply guard to protected routes:
- Certain profile updates
- Premium features
- Critical actions

### Step 9: Update Auth Response DTOs

Create `backend/src/auth/dto/verification-response.dto.ts`:
```typescript
export class VerificationResponseDto {
  message: string;
  emailVerified: boolean;
}
```

Update login response to include `emailVerified` status:
```typescript
{
  user: {
    id: string;
    email: string;
    emailVerified: boolean;  // Add this
    role: string;
    ...
  },
  tokens: {
    accessToken: string;
    refreshToken: string;
  }
}
```

### Step 10: Rate Limiting

Add rate limiting to verification endpoints:
```typescript
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 3, ttl: 300000 } })  // 3 requests per 5 minutes
@Post('resend-verification')
async resendVerification(@Body() body: ResendVerificationDto) {
  // ...
}
```

### Step 11: Create Frontend Integration Points

Document API endpoints for frontend:

**After Registration:**
1. Show "Please check your email" message
2. Provide "Resend email" button
3. Show email verification banner

**Email Link:**
- Click link → Frontend captures token
- Frontend calls `/api/auth/verify-email` with token
- Show success/error message
- Redirect to dashboard/login

**Login:**
- Check `emailVerified` in response
- Show verification reminder if false
- Allow resending verification email

## Testing Plan

### Manual Testing

```powershell
# 1. Register new user
$body = @{
  email = "test@example.com"
  password = "Test123!"
  firstName = "Test"
  lastName = "User"
  role = "player"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3333/api/auth/register" `
  -Method POST -Body $body -ContentType "application/json"

# Check email for verification link

# 2. Verify email with token
$verifyBody = @{ token = "token-from-email" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3333/api/auth/verify-email" `
  -Method POST -Body $verifyBody -ContentType "application/json"

# 3. Resend verification email
$resendBody = @{ email = "test@example.com" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3333/api/auth/resend-verification" `
  -Method POST -Body $resendBody -ContentType "application/json"

# 4. Try to access protected route without verification
# Should get 403 Forbidden error
```

### Test Cases

1. ✅ User registers → Verification email sent
2. ✅ User clicks link → Email verified
3. ✅ User tries expired token → Error message
4. ✅ User resends email → New email sent
5. ✅ Rate limit works → Max 3 resends per 5 min
6. ✅ Already verified → Can't verify again
7. ✅ Email verified guard → Blocks unverified users
8. ✅ Login response → Includes emailVerified status

## Security Considerations

1. **Token Security:**
   - Use cryptographically secure random tokens (32 bytes)
   - Hash tokens before storing in database
   - Set expiration (24 hours)
   - One-time use tokens

2. **Rate Limiting:**
   - Limit verification email requests
   - Prevent email bombing attacks
   - Track by IP and email address

3. **Email Validation:**
   - Validate email format
   - Check for disposable email domains (optional)
   - Prevent duplicate registrations

4. **Error Messages:**
   - Don't reveal if email exists in system
   - Generic error messages for security
   - Log detailed errors server-side

## Database Schema Changes

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN "emailVerified" boolean DEFAULT false;
ALTER TABLE users ADD COLUMN "emailVerificationToken" varchar(255);
ALTER TABLE users ADD COLUMN "emailVerificationExpires" timestamp;

-- Create index for token lookups
CREATE INDEX idx_users_verification_token ON users("emailVerificationToken");
```

## File Structure

```
backend/src/
├── mail/
│   ├── mail.module.ts          # NEW
│   ├── mail.service.ts         # NEW
│   └── templates/
│       ├── verification-email.hbs   # NEW
│       └── welcome-email.hbs       # NEW
├── auth/
│   ├── dto/
│   │   ├── verify-email.dto.ts          # NEW
│   │   ├── resend-verification.dto.ts   # NEW
│   │   └── verification-response.dto.ts # NEW
│   ├── guards/
│   │   └── email-verified.guard.ts      # NEW
│   ├── auth.service.ts         # MODIFIED - Add verification logic
│   └── auth.controller.ts      # MODIFIED - Add verification endpoints
├── users/
│   └── entities/
│       └── user.entity.ts      # MODIFIED - Add verification fields
└── migrations/
    └── TIMESTAMP-AddEmailVerification.ts  # NEW
```

## Expected Outcomes

✅ **Email Service Configured** - Sending emails successfully  
✅ **Verification Flow** - Complete registration → email → verify workflow  
✅ **Database Updated** - User table has verification fields  
✅ **API Endpoints** - Verify and resend endpoints working  
✅ **Email Templates** - Professional HTML emails  
✅ **Security** - Tokens secured, rate limiting applied  
✅ **Documentation** - API docs updated with new endpoints  
✅ **Testing** - All test cases passing  

## Next Steps (Task #6)

After email verification is complete:
- Password reset flow (uses same email service)
- Password reset tokens (similar to verification tokens)
- Reset email templates
- Reset password endpoints

## Timeline Estimate

- **Step 1-2:** Install dependencies & configure email service (~30 min)
- **Step 3:** Update User entity & migration (~15 min)
- **Step 4:** Update registration flow (~20 min)
- **Step 5:** Create verification endpoints (~30 min)
- **Step 6:** Create email templates (~20 min)
- **Step 7:** Environment configuration (~10 min)
- **Step 8:** Add verification guards (~15 min)
- **Step 9-10:** DTOs & rate limiting (~15 min)
- **Step 11:** Testing & documentation (~30 min)

**Total:** ~3 hours

## Success Criteria

- [ ] Email service configured and tested
- [ ] Users receive verification emails upon registration
- [ ] Email verification endpoint working correctly
- [ ] Resend verification working with rate limiting
- [ ] Email verified guard protecting routes
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code committed and pushed

---

**Status:** Ready to implement  
**Priority:** High  
**Dependencies:** Phase 2 Tasks #3-4 (Complete ✅)  
**Blocks:** Task #6 (Password Reset)
