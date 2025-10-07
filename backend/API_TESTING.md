# API Testing Guide

This guide provides examples for testing the Astral Turf Backend API endpoints.

## Base URL

- **Development:** `http://localhost:3333/api`
- **Production:** TBD

## Authentication Endpoints

### 1. Register New User

**POST** `/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "email": "newuser@astralturf.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "player"
}
```

**Roles:** `coach`, `player`, `family`, `admin`

**PowerShell Example:**
```powershell
$body = @{
  email = "newuser@astralturf.com"
  password = "SecurePass123!"
  firstName = "John"
  lastName = "Doe"
  role = "player"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3333/api/auth/register" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "newuser@astralturf.com",
    "role": "player",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2025-10-07T...",
    "updatedAt": "2025-10-07T..."
  },
  "tokens": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

### 2. Login

**POST** `/auth/login`

Authenticate existing user and receive tokens.

**Request Body:**
```json
{
  "email": "coach@astralturf.com",
  "password": "SecurePass123!"
}
```

**PowerShell Example:**
```powershell
$body = @{
  email = "coach@astralturf.com"
  password = "SecurePass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3333/api/auth/login" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"

# Save tokens for later use
$accessToken = $response.tokens.accessToken
$refreshToken = $response.tokens.refreshToken
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "coach@astralturf.com",
    "role": "coach",
    "firstName": "John",
    "lastName": "Coach",
    "isActive": true
  },
  "tokens": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

### 3. Verify Token

**POST** `/auth/verify`

Verify JWT access token and get user info.

**Headers:**
- `Authorization: Bearer {accessToken}`

**PowerShell Example:**
```powershell
$headers = @{
  Authorization = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "http://localhost:3333/api/auth/verify" `
  -Method POST `
  -Headers $headers
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "coach@astralturf.com",
    "role": "coach"
  }
}
```

### 4. Refresh Token

**POST** `/auth/refresh`

Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**PowerShell Example:**
```powershell
$body = @{
  refreshToken = $refreshToken
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3333/api/auth/refresh" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"

# Update access token
$accessToken = $response.accessToken
```

**Response:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

### 5. Logout

**POST** `/auth/logout`

Invalidate current session.

**Headers:**
- `Authorization: Bearer {accessToken}`

**PowerShell Example:**
```powershell
$headers = @{
  Authorization = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "http://localhost:3333/api/auth/logout" `
  -Method POST `
  -Headers $headers
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## User Endpoints

### 1. Get All Users

**GET** `/users`

Retrieve all users (admin only).

**Headers:**
- `Authorization: Bearer {accessToken}`

**PowerShell Example:**
```powershell
$headers = @{
  Authorization = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "http://localhost:3333/api/users" `
  -Method GET `
  -Headers $headers
```

### 2. Get User by ID

**GET** `/users/:id`

Retrieve specific user details.

**Headers:**
- `Authorization: Bearer {accessToken}`

**PowerShell Example:**
```powershell
$userId = "c66f7d6f-df91-4fa2-9323-3274a8d0b179"
$headers = @{
  Authorization = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "http://localhost:3333/api/users/$userId" `
  -Method GET `
  -Headers $headers
```

### 3. Update User

**PUT** `/users/:id`

Update user information.

**Headers:**
- `Authorization: Bearer {accessToken}`

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "phoneNumber": "+1234567890"
}
```

**PowerShell Example:**
```powershell
$userId = "c66f7d6f-df91-4fa2-9323-3274a8d0b179"
$body = @{
  firstName = "Updated"
  lastName = "Name"
  phoneNumber = "+1234567890"
} | ConvertTo-Json

$headers = @{
  Authorization = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "http://localhost:3333/api/users/$userId" `
  -Method PUT `
  -Body $body `
  -Headers $headers `
  -ContentType "application/json"
```

### 4. Delete User

**DELETE** `/users/:id`

Delete user account (admin only).

**Headers:**
- `Authorization: Bearer {accessToken}`

**PowerShell Example:**
```powershell
$userId = "c66f7d6f-df91-4fa2-9323-3274a8d0b179"
$headers = @{
  Authorization = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "http://localhost:3333/api/users/$userId" `
  -Method DELETE `
  -Headers $headers
```

## Testing Workflow

### Complete Authentication Flow

```powershell
# 1. Register new user
$registerBody = @{
  email = "test@example.com"
  password = "Test123!"
  firstName = "Test"
  lastName = "User"
  role = "player"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod `
  -Uri "http://localhost:3333/api/auth/register" `
  -Method POST `
  -Body $registerBody `
  -ContentType "application/json"

$accessToken = $registerResponse.tokens.accessToken
$refreshToken = $registerResponse.tokens.refreshToken
$userId = $registerResponse.user.id

# 2. Verify token
$headers = @{ Authorization = "Bearer $accessToken" }
$verifyResponse = Invoke-RestMethod `
  -Uri "http://localhost:3333/api/auth/verify" `
  -Method POST `
  -Headers $headers

Write-Host "✅ Token verified for: $($verifyResponse.user.email)"

# 3. Get user profile
$userProfile = Invoke-RestMethod `
  -Uri "http://localhost:3333/api/users/$userId" `
  -Method GET `
  -Headers $headers

Write-Host "✅ User profile retrieved: $($userProfile.email)"

# 4. Update profile
$updateBody = @{
  phoneNumber = "+1234567890"
  timezone = "America/New_York"
} | ConvertTo-Json

$updatedUser = Invoke-RestMethod `
  -Uri "http://localhost:3333/api/users/$userId" `
  -Method PUT `
  -Body $updateBody `
  -Headers $headers `
  -ContentType "application/json"

Write-Host "✅ Profile updated"

# 5. Refresh token
$refreshBody = @{
  refreshToken = $refreshToken
} | ConvertTo-Json

$refreshResponse = Invoke-RestMethod `
  -Uri "http://localhost:3333/api/auth/refresh" `
  -Method POST `
  -Body $refreshBody `
  -ContentType "application/json"

$accessToken = $refreshResponse.accessToken

Write-Host "✅ Token refreshed"

# 6. Logout
Invoke-RestMethod `
  -Uri "http://localhost:3333/api/auth/logout" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $accessToken" }

Write-Host "✅ Logged out successfully"
```

## Demo Accounts

After running `npm run seed`, these demo accounts are available:

| Email | Password | Role |
|-------|----------|------|
| `admin@astralturf.com` | `Demo123!` | admin |
| `coach.demo@astralturf.com` | `Demo123!` | coach |
| `player.demo@astralturf.com` | `Demo123!` | player |
| `family.demo@astralturf.com` | `Demo123!` | family |

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be a valid email"]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## Rate Limiting

- **Default:** 100 requests per 60 seconds per IP
- **Header:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## JWT Token Expiration

- **Access Token:** 15 minutes
- **Refresh Token:** 7 days

## Next Steps

- Test protected endpoints with different roles
- Test error handling
- Test rate limiting
- Set up automated API tests
- Create Postman/Insomnia collection
