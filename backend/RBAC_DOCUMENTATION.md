# Role-Based Access Control (RBAC) Documentation

## Overview

The Astral Turf backend implements a comprehensive Role-Based Access Control (RBAC) system to secure API endpoints based on user roles. This system ensures that users can only access resources and perform actions appropriate to their role.

## User Roles

The system supports four distinct user roles:

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | System administrators | Full access to all resources |
| `coach` | Team coaches | Manage players, view analytics, create training sessions |
| `player` | Team players | View own data, training sessions, performance metrics |
| `family` | Player family members | View player data (with permissions), limited access |

## Architecture

### Components

**1. Decorators** (`src/auth/decorators/`)

- **`@Roles(...roles)`** - Mark endpoints with required roles
- **`@Public()`** - Mark endpoints as publicly accessible (no authentication required)
- **`@CurrentUser()`** - Inject authenticated user into route handler

**2. Guards** (`src/auth/guards/`)

- **`JwtAuthGuard`** - Validates JWT tokens and allows public routes
- **`RolesGuard`** - Enforces role-based access control

**3. Global Configuration** (`src/app.module.ts`)

```typescript
{
  provide: APP_GUARD,
  useClass: JwtAuthGuard, // Apply JWT auth globally
},
{
  provide: APP_GUARD,
  useClass: RolesGuard, // Apply role checks globally
}
```

## Usage

### Protecting Endpoints

#### Example 1: Admin-Only Endpoint

```typescript
@Delete(':id')
@Roles(UserRole.ADMIN) // Only admins can delete users
async remove(@Param('id') id: string): Promise<void> {
  return this.usersService.remove(id);
}
```

#### Example 2: Multiple Roles

```typescript
@Get()
@Roles(UserRole.ADMIN, UserRole.COACH) // Admins AND coaches can access
async findAll(): Promise<User[]> {
  return this.usersService.findAll();
}
```

#### Example 3: All Authenticated Users

```typescript
@Get('me')
@Roles(UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.FAMILY)
async getProfile(@CurrentUser() user: { id: string }): Promise<User> {
  return this.usersService.findOne(user.id);
}
```

#### Example 4: Public Endpoint (No Authentication)

```typescript
@Public()
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

### Using CurrentUser Decorator

The `@CurrentUser()` decorator provides access to the authenticated user's information:

```typescript
@Get('profile')
@Roles(UserRole.PLAYER)
async getMyProfile(@CurrentUser() user: { id: string; email: string; role: string }) {
  // user.id, user.email, user.role are available
  return this.usersService.findOne(user.id);
}
```

## Current Endpoint Permissions

### Authentication Endpoints (`/api/auth`)

| Endpoint | Method | Roles | Description |
|----------|--------|-------|-------------|
| `/register` | POST | `@Public()` | Register new user |
| `/login` | POST | `@Public()` | User login |
| `/logout` | POST | Authenticated | Logout current user |
| `/refresh` | POST | `@Public()` | Refresh JWT tokens |
| `/verify` | POST | Authenticated | Verify JWT token |

### User Endpoints (`/api/users`)

| Endpoint | Method | Roles | Description |
|----------|--------|-------|-------------|
| `/` | GET | `admin`, `coach` | List all users |
| `/me` | GET | All authenticated | Get own profile |
| `/:id` | GET | `admin`, `coach` | Get specific user |
| `/:id` | PUT | `admin`, `coach` | Update user |
| `/:id` | DELETE | `admin` | Delete user |

## Testing RBAC

### PowerShell Test Script

```powershell
# 1. Login as coach
$body = @{
  email = "coach@astralturf.com"
  password = "SecurePass123!"
} | ConvertTo-Json

$coachResponse = Invoke-RestMethod -Uri "http://localhost:3333/api/auth/login" `
  -Method POST -Body $body -ContentType "application/json"

$coachToken = $coachResponse.tokens.accessToken

# 2. Test coach accessing all users (SHOULD SUCCEED)
$headers = @{ Authorization = "Bearer $coachToken" }
$users = Invoke-RestMethod -Uri "http://localhost:3333/api/users" `
  -Method GET -Headers $headers

Write-Host "Coach can view $($users.Count) users" -ForegroundColor Green

# 3. Register a player
$body = @{
  email = "player.test@astralturf.com"
  password = "Demo123!"
  firstName = "Test"
  lastName = "Player"
  role = "player"
} | ConvertTo-Json

$playerResponse = Invoke-RestMethod -Uri "http://localhost:3333/api/auth/register" `
  -Method POST -Body $body -ContentType "application/json"

$playerToken = $playerResponse.tokens.accessToken

# 4. Test player accessing all users (SHOULD FAIL with 403)
$headers = @{ Authorization = "Bearer $playerToken" }
try {
  Invoke-RestMethod -Uri "http://localhost:3333/api/users" `
    -Method GET -Headers $headers
  Write-Host "SECURITY BUG: Player should not have access!" -ForegroundColor Red
} catch {
  if ($_.Exception.Response.StatusCode -eq 403) {
    Write-Host "Player correctly denied (403 Forbidden)" -ForegroundColor Green
  }
}

# 5. Test player accessing own profile (SHOULD SUCCEED)
$me = Invoke-RestMethod -Uri "http://localhost:3333/api/users/me" `
  -Method GET -Headers $headers

Write-Host "Player can view own profile: $($me.email)" -ForegroundColor Green

# 6. Test unauthenticated access (SHOULD FAIL with 401)
try {
  Invoke-RestMethod -Uri "http://localhost:3333/api/users" -Method GET
  Write-Host "SECURITY BUG: Unauthenticated access allowed!" -ForegroundColor Red
} catch {
  if ($_.Exception.Response.StatusCode -eq 401) {
    Write-Host "Unauthenticated request correctly denied (401)" -ForegroundColor Green
  }
}
```

## HTTP Status Codes

- **200 OK** - Request successful
- **401 Unauthorized** - No valid JWT token provided
- **403 Forbidden** - User authenticated but lacks required role
- **404 Not Found** - Resource not found

## Error Responses

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

## Security Features

### 1. Global Guards

All endpoints require authentication by default. Use `@Public()` decorator to explicitly mark public endpoints.

### 2. Role Hierarchy

Roles are flat - there is no inheritance. Each endpoint explicitly declares which roles can access it.

### 3. JWT Validation

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens include user ID, email, and role in payload

### 4. Token in Header

All authenticated requests must include:

```
Authorization: Bearer {accessToken}
```

## Best Practices

### 1. Principle of Least Privilege

Grant users only the minimum permissions needed:

```typescript
// ✅ Good - Specific roles
@Roles(UserRole.ADMIN, UserRole.COACH)

// ❌ Bad - All roles (use no decorator instead)
@Roles(UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.FAMILY)
```

### 2. Explicit Public Routes

Always mark public routes explicitly:

```typescript
@Public()
@Post('login')
async login(@Body() loginDto: LoginDto) { ... }
```

### 3. Use CurrentUser Decorator

Instead of accessing `@Request() req`:

```typescript
// ✅ Good
async getProfile(@CurrentUser() user: { id: string }) {
  return this.usersService.findOne(user.id);
}

// ❌ Avoid
async getProfile(@Request() req: { user: { id: string } }) {
  return this.usersService.findOne(req.user.id);
}
```

### 4. Controller-Level Guards

Apply guards at the controller level when all routes need protection:

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController { ... }
```

## Future Enhancements

- **Permission-based access** - Fine-grained permissions beyond roles
- **Dynamic role assignment** - Allow changing user roles at runtime
- **Role hierarchies** - Admin inherits coach permissions, etc.
- **Resource-based access** - e.g., coaches can only manage their own team
- **Audit logging** - Track who accessed what and when
- **Rate limiting per role** - Different rate limits for different roles

## Troubleshooting

### Issue: Getting 401 on authenticated endpoint

**Cause:** JWT token expired or invalid

**Solution:**
1. Check token expiration with `/api/auth/verify`
2. Refresh token using `/api/auth/refresh`
3. Re-login if refresh token expired

### Issue: Getting 403 on endpoint you should access

**Cause:** User role doesn't match required roles

**Solution:**
1. Check user's role with `/api/users/me`
2. Verify endpoint's `@Roles()` decorator matches your role
3. Contact admin if role needs to be updated

### Issue: Public endpoint requires authentication

**Cause:** Missing `@Public()` decorator

**Solution:**
```typescript
@Public() // Add this decorator
@Post('login')
async login(@Body() loginDto: LoginDto) { ... }
```

## Summary

✅ **Implemented:**
- Four distinct user roles (admin, coach, player, family)
- Global JWT authentication
- Role-based access control with `@Roles()` decorator
- Public routes with `@Public()` decorator
- Current user injection with `@CurrentUser()` decorator
- Comprehensive endpoint protection

✅ **Tested:**
- Coach can access admin/coach-only endpoints
- Player cannot access admin/coach-only endpoints
- All users can access their own profile
- Unauthenticated requests are denied
- Public routes work without authentication

🎉 **Phase 2 Task #3: Role-Based Access Control - COMPLETE!**
