# Astral Turf Backend API

NestJS backend for the Astral Turf football management platform.

## 🚀 Features

- **JWT Authentication** - Secure token-based auth with access & refresh tokens
- **Role-Based Access Control** - 4 user roles (Coach, Player, Family, Admin)
- **PostgreSQL Database** - Robust relational data storage
- **TypeORM** - Type-safe database operations
- **Redis Sessions** - Fast session management
- **Rate Limiting** - Protection against brute force attacks
- **Input Validation** - Class-validator for DTO validation
- **Security** - Helmet, CORS, password hashing (bcrypt)

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.2
- npm >= 9.0.0

## 🛠️ Installation

1. **Clone the repository** (if not already)
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   - Database credentials
   - JWT secrets (generate secure random strings)
   - Redis configuration
   - Frontend URL for CORS

4. **Set up PostgreSQL database**
   
   Option A: Local PostgreSQL
   ```bash
   # Create database
   psql -U postgres
   CREATE DATABASE astral_turf_db;
   CREATE USER astral_turf_user WITH PASSWORD 'your_secure_password_here';
   GRANT ALL PRIVILEGES ON DATABASE astral_turf_db TO astral_turf_user;
   ```

   Option B: Use Docker
   ```bash
   docker run --name astral-turf-postgres \
     -e POSTGRES_DB=astral_turf_db \
     -e POSTGRES_USER=astral_turf_user \
     -e POSTGRES_PASSWORD=your_secure_password_here \
     -p 5432:5432 \
     -d postgres:14
   ```

5. **Set up Redis**
   
   Option A: Local Redis
   ```bash
   # Install and start Redis
   redis-server
   ```

   Option B: Use Docker
   ```bash
   docker run --name astral-turf-redis \
     -p 6379:6379 \
     -d redis:7
   ```

6. **Run database migrations**
   ```bash
   npm run migration:run
   ```

## 🏃 Running the Application

### Development mode
```bash
npm run start:dev
```

### Production mode
```bash
npm run build
npm run start:prod
```

### Debug mode
```bash
npm run start:debug
```

The API will be available at `http://localhost:3001/api`

## 📚 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Create new user account | No |
| POST | `/login` | Login with email/password | No |
| POST | `/logout` | Logout and invalidate refresh token | Yes |
| POST | `/refresh` | Get new access token | No |
| POST | `/verify` | Verify current token | Yes |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all users | Yes |
| GET | `/:id` | Get user by ID | Yes |
| PUT | `/:id` | Update user profile | Yes |
| DELETE | `/:id` | Delete user account | Yes |

## 🔐 Authentication Flow

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "coach"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "coach@example.com",
    "role": "coach",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Access Protected Routes
```bash
curl -X GET http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 🗃️ Database Schema

### Users Table
- `id` (UUID, PK)
- `email` (unique)
- `password` (hashed)
- `role` (enum: coach, player, family, admin)
- `firstName`, `lastName`
- `profileImage`, `phoneNumber`
- `timezone`, `language`
- `notifications` (JSONB)
- `isActive`, `emailVerified`
- `createdAt`, `updatedAt`, `lastLoginAt`

### Sessions Table
- `id` (UUID, PK)
- `userId` (FK to users)
- `refreshToken`
- `expiresAt`
- `ipAddress`, `userAgent`
- `createdAt`

### Family Permissions Table
- `id` (UUID, PK)
- `familyMemberId` (FK to users)
- `playerId` (reference to player)
- `relationship` (enum)
- Permission flags (canViewStats, canViewSchedule, etc.)
- `approvedByCoach`
- `createdAt`, `updatedAt`

## 🧪 Testing

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## 🔨 Development Scripts

```bash
npm run format      # Format code with Prettier
npm run lint        # Lint code with ESLint
npm run build       # Build for production
```

## 📦 Project Structure

```
backend/
├── src/
│   ├── auth/
│   │   ├── dto/              # Data transfer objects
│   │   ├── guards/           # Auth guards (JWT, Local)
│   │   ├── strategies/       # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── entities/         # TypeORM entities
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── app.module.ts         # Root module
│   └── main.ts               # Application entry point
├── .env.example              # Environment template
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3001` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database user | - |
| `DB_PASSWORD` | Database password | - |
| `DB_DATABASE` | Database name | `astral_turf_db` |
| `JWT_ACCESS_SECRET` | Access token secret | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `JWT_ACCESS_EXPIRATION` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL | `7d` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `THROTTLE_TTL` | Rate limit window (seconds) | `60` |
| `THROTTLE_LIMIT` | Max requests per window | `100` |

## 🚨 Security Best Practices

1. **Secrets Management**
   - Never commit `.env` file
   - Use strong, random JWT secrets
   - Rotate secrets periodically

2. **Password Requirements**
   - Minimum 8 characters
   - Hashed with bcrypt (10 rounds)

3. **Token Management**
   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 7 days
   - Tokens invalidated on logout

4. **Rate Limiting**
   - 100 requests per 60 seconds per IP
   - Protects against brute force attacks

## 📝 Next Steps (Phase 1 Completion)

- [ ] Redis integration for session caching
- [ ] Role-based authorization decorators
- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Admin endpoints for user management
- [ ] Family permission approval workflow
- [ ] Audit logging for security events

## 🤝 Contributing

This is Phase 1 of the Astral Turf platform modernization. Follow the comprehensive plan for full implementation details.

## 📄 License

Proprietary - Astral Turf Platform

---

**Status:** Phase 1 - Backend Foundation ✅ In Progress
**Next:** Database setup and testing
