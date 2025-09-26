# 🚀 Astral Turf - Vercel Deployment Guide

This guide provides multiple ways to deploy the Astral Turf application to Vercel with all necessary configurations.

## 🎯 Quick Start (Automated)

### Option 1: Windows Batch Script (Recommended for Windows)
```bash
# For preview deployment
deploy-vercel.bat

# For production deployment
deploy-vercel.bat --prod
```

### Option 2: Node.js Script (Cross-platform)
```bash
# For preview deployment
node deploy-vercel.js

# For production deployment
node deploy-vercel.js --prod

# With custom Gemini API key
GEMINI_API_KEY=your-api-key node deploy-vercel.js --prod
```

### Option 3: PowerShell Script (Windows PowerShell)
```powershell
# For preview deployment
./deploy-vercel.ps1

# For production deployment
./deploy-vercel.ps1 -Production

# With custom settings
./deploy-vercel.ps1 -ProjectName "my-astral-turf" -GeminiApiKey "your-key" -Production
```

## 📋 Prerequisites

Before running the deployment scripts, ensure you have:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **Git** (for version control)
4. **Vercel Account** - [Sign up here](https://vercel.com/signup)

## 🔧 Manual Deployment (Step by Step)

If you prefer to deploy manually or the automated scripts don't work:

### Step 1: Install Dependencies
```bash
npm install
npm install -g vercel@latest
```

### Step 2: Build the Project
```bash
npm run build
npx prisma generate
```

### Step 3: Login to Vercel
```bash
vercel login
```

### Step 4: Initialize Project
```bash
vercel
# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account/team)
# - Link to existing project? N (for new project)
# - What's your project's name? astral-turf
# - In which directory is your code located? ./
```

### Step 5: Set Environment Variables
Go to your [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add these variables for **Production**:

#### Database Configuration
```
DATABASE_URL=postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL=postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech
POSTGRES_PASSWORD=npg_z3tIi9kCFDxB
POSTGRES_DATABASE=neondb
```

#### Authentication & Security
```
JWT_SECRET=astral-turf-super-secure-jwt-secret-key-2024-production-v8
JWT_ROTATION_INTERVAL_HOURS=24
JWT_GRACE_PERIOD_HOURS=2
```

#### AI Services
```
GEMINI_API_KEY=your-production-gemini-api-key-here
```

#### Application Settings
```
NODE_ENV=production
APP_VERSION=8.0.0
LOG_LEVEL=info
ENABLE_AI_FEATURES=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_ANALYTICS=true
ENABLE_ERROR_TRACKING=true
```

### Step 6: Deploy
```bash
# For preview deployment
vercel

# For production deployment
vercel --prod
```

## 🌐 Environment Variables Reference

<details>
<summary>Complete Environment Variables List (Click to expand)</summary>

### Core Application
- `NODE_ENV=production`
- `APP_VERSION=8.0.0`
- `PORT=3000`

### Database (Neon PostgreSQL)
- `DATABASE_URL` - Main database connection string
- `DATABASE_URL_UNPOOLED` - Direct connection without pooling
- `POSTGRES_URL` - Vercel Postgres compatible URL
- `POSTGRES_USER` - Database username
- `POSTGRES_HOST` - Database host
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DATABASE` - Database name
- `POSTGRES_PRISMA_URL` - Prisma-specific connection string

### Authentication & Security
- `JWT_SECRET` - JWT signing secret (change this!)
- `JWT_ROTATION_INTERVAL_HOURS=24` - How often to rotate JWT secrets
- `JWT_GRACE_PERIOD_HOURS=2` - Grace period for old JWT secrets
- `JWT_KEY_LENGTH=64` - JWT key length in bytes
- `JWT_MAX_KEYS=5` - Maximum number of JWT keys to keep
- `JWT_AUTO_ROTATION=true` - Enable automatic JWT rotation

### AI Services
- `GEMINI_API_KEY` - Your Google Gemini API key
- `OPENAI_API_KEY` - Your OpenAI API key (optional)

### Redis (Optional - for caching)
- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`
- `REDIS_PASSWORD=` (empty for local)
- `REDIS_DB=0`
- `REDIS_KEY_PREFIX=astral-turf-prod:`

### Logging & Monitoring
- `LOG_LEVEL=info`
- `LOG_FLUSH_INTERVAL_MS=30000`

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS=900000` (15 minutes)
- `RATE_LIMIT_MAX_REQUESTS=100`

### File Upload
- `MAX_FILE_SIZE=10485760` (10MB)
- `ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain`

### Feature Flags
- `ENABLE_AI_FEATURES=true`
- `ENABLE_REAL_TIME_UPDATES=true`
- `ENABLE_ANALYTICS=true`
- `ENABLE_ERROR_TRACKING=true`

### Security
- `SECURE_COOKIES=true`
- `COOKIE_DOMAIN=.vercel.app`

### Performance
- `CACHE_TTL=3600` (1 hour)
- `SESSION_TIMEOUT=86400` (24 hours)
- `MAX_CONCURRENT_REQUESTS=100`

</details>

## 🔍 Verification & Testing

After deployment, verify your application:

1. **Health Check**: Visit `https://your-app.vercel.app/health`
2. **Authentication**: Test login/signup at `https://your-app.vercel.app/api/auth`
3. **Main App**: Visit `https://your-app.vercel.app`

Expected health check response:
```json
{
  "status": "healthy",
  "timestamp": "2024-09-25T15:30:00.000Z",
  "checks": {
    "database": { "status": "healthy" },
    "environment": { "status": "healthy" }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Fails
```bash
# Check if dependencies are installed
npm install

# Try building locally first
npm run build

# Check for TypeScript errors
npm run type-check
```

#### 2. Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Check if your Neon database is active
- Ensure the database allows connections from Vercel

#### 3. Environment Variables Not Working
- Make sure variables are set for the correct environment (Production/Preview)
- Check for typos in variable names
- Restart deployment after adding variables

#### 4. Vercel CLI Issues
```bash
# Reinstall Vercel CLI
npm uninstall -g vercel
npm install -g vercel@latest

# Clear Vercel cache
vercel logout
vercel login
```

#### 5. API Routes Not Working
- Check if your `api/` folder is in the project root
- Verify `vercel.json` configuration
- Check function timeout settings

### Getting Help

If you encounter issues:

1. Check the [Vercel Documentation](https://vercel.com/docs)
2. Review deployment logs in Vercel Dashboard
3. Check the browser console for client-side errors
4. Review server logs in Vercel Functions tab

## 📊 Monitoring & Maintenance

### Vercel Dashboard Features
- **Analytics**: Monitor performance and usage
- **Functions**: View serverless function logs
- **Deployments**: Track deployment history
- **Domains**: Configure custom domains
- **Environment Variables**: Manage configuration

### Regular Maintenance
- Monitor database usage in Neon dashboard
- Check application logs for errors
- Update dependencies regularly
- Monitor API usage (Gemini AI)
- Review security logs

## 🔄 CI/CD Integration

The project includes GitHub Actions workflow (`.github/workflows/vercel-deploy.yml`) for automated deployments:

1. **On Pull Request**: Deploy preview
2. **On Main Branch**: Deploy to production
3. **Automatic Testing**: Run tests before deployment

To use CI/CD:
1. Add secrets to GitHub repository:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `PRODUCTION_URL`

## 🎯 Next Steps

After successful deployment:

1. **Custom Domain**: Configure your domain in Vercel
2. **SSL Certificate**: Vercel provides automatic HTTPS
3. **Monitoring**: Set up error tracking (Sentry)
4. **Analytics**: Configure usage analytics
5. **Backup**: Set up database backups
6. **Performance**: Monitor Core Web Vitals

---

## 📞 Support

For deployment support:
- Check deployment logs in Vercel Dashboard
- Review this documentation
- Test locally first: `npm run dev`
- Verify all environment variables are set correctly

**Happy Deploying! 🚀**
