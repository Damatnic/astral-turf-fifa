# 🚀 Astral Turf - Complete Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the Astral Turf tactical board application to Vercel with full production configuration.

## 📋 Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [GitHub Repository](https://github.com) connected to your Vercel account
- Node.js 20+ installed locally
- PostgreSQL database (Vercel Postgres recommended)

## 🔐 Environment Variables Setup

### Required Environment Variables

Copy the `.env.example` file to create your production environment variables:

```bash
# Vercel Postgres Database
DATABASE_URL="postgresql://username:password@localhost:5432/astralturf"
POSTGRES_URL="postgresql://username:password@localhost:5432/astralturf"
POSTGRES_PRISMA_URL="postgresql://username:password@localhost:5432/astralturf?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgresql://username:password@localhost:5432/astralturf?sslmode=require"

# NextAuth.js Configuration
NEXTAUTH_SECRET="your-nextauth-secret-key-here-minimum-32-characters"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_URL_INTERNAL="https://your-app.vercel.app"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# JWT Configuration
JWT_SECRET="your-jwt-secret-key-minimum-32-characters"

# OpenAI API Configuration
OPENAI_API_KEY="sk-proj-your-openai-api-key-here"
API_KEY="sk-proj-your-openai-api-key-here"

# Vercel Configuration
NODE_ENV="production"
VERCEL="1"
VERCEL_REGION="iad1"
```

## 🗄️ Database Setup

### 1. Create Vercel Postgres Database

```bash
# Install Vercel CLI
npm install -g vercel@latest

# Login to Vercel
vercel login

# Create a new Postgres database
vercel postgres create astral-turf-db

# Connect to your project
vercel link

# Add database to your project
vercel env add DATABASE_URL
vercel env add POSTGRES_URL
vercel env add POSTGRES_PRISMA_URL
vercel env add POSTGRES_URL_NON_POOLING
```

### 2. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Deploy migrations to production database
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```

## 🚀 Deployment Steps

### 1. Initial Vercel Setup

```bash
# Clone the repository
git clone https://github.com/your-username/astral-turf-fifa.git
cd astral-turf-fifa

# Install dependencies
npm ci

# Link to Vercel project
vercel link

# Configure environment variables in Vercel dashboard
# or use CLI:
vercel env add NEXTAUTH_SECRET
vercel env add JWT_SECRET
vercel env add OPENAI_API_KEY
# ... add all required variables
```

### 2. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

```bash
# Vercel Integration
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-organization-id
VERCEL_PROJECT_ID=your-project-id

# Database
DATABASE_URL=your-production-database-url
POSTGRES_PRISMA_URL=your-prisma-database-url
```

### 3. Deploy to Production

Push to the main branch to trigger automatic deployment:

```bash
git add .
git commit -m "🚀 Initial Vercel deployment setup"
git push origin main
```

## 🔒 Authentication Setup

### NextAuth.js Configuration

1. **Google OAuth Setup:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add your Vercel domain to authorized origins
   - Add callback URL: `https://your-app.vercel.app/api/auth/callback/google`

2. **GitHub OAuth Setup:**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`

3. **Add OAuth credentials to Vercel:**
   ```bash
   vercel env add GOOGLE_CLIENT_ID
   vercel env add GOOGLE_CLIENT_SECRET
   vercel env add GITHUB_ID
   vercel env add GITHUB_SECRET
   ```

## 📊 Analytics & Monitoring

### Vercel Analytics

Analytics are automatically enabled with the `@vercel/analytics` package. View metrics in your Vercel dashboard.

### Custom Analytics API

The deployment includes a custom analytics API at `/api/analytics` for tracking application-specific events.

## 🔧 Advanced Configuration

### Custom Domain Setup

1. **Add domain in Vercel dashboard:**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Configure DNS records as instructed

2. **Update environment variables:**
   ```bash
   vercel env add NEXTAUTH_URL production "https://your-custom-domain.com"
   ```

### Edge Functions Configuration

The application uses Vercel's edge functions for:
- Authentication (NextAuth.js)
- Database operations (Prisma)
- Analytics tracking
- Health monitoring

### Performance Optimization

- **Asset optimization:** Configured for Vercel's edge network
- **Code splitting:** Optimized chunk loading
- **Caching:** Aggressive caching for static assets
- **Compression:** Automatic compression on Vercel

## 🧪 Testing Deployment

### 1. Health Check

Test the deployment health endpoint:

```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "Astral Turf Tactical Board API is running",
  "version": "8.0.0",
  "checks": {
    "database": {
      "status": "connected",
      "responseTime": "45ms"
    },
    "api": {
      "status": "operational"
    }
  }
}
```

### 2. Authentication Test

1. Visit `https://your-app.vercel.app/auth/signin`
2. Test OAuth providers (Google, GitHub)
3. Test email/password authentication

### 3. Database Connection Test

Check database connectivity through the API:

```bash
curl https://your-app.vercel.app/api/formations
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Verify `POSTGRES_PRISMA_URL` includes `?pgbouncer=true&connect_timeout=15`
   - Check database URL encoding for special characters
   - Ensure database is accessible from Vercel regions

2. **Authentication Issues:**
   - Verify `NEXTAUTH_SECRET` is set and secure
   - Check OAuth callback URLs match exactly
   - Ensure `NEXTAUTH_URL` matches your domain

3. **Build Failures:**
   - Check Node.js version (requires 20+)
   - Verify all environment variables are set
   - Review build logs in Vercel dashboard

### Debug Mode

Enable debug logging by adding:

```bash
vercel env add DEBUG "1"
vercel env add LOG_LEVEL "debug"
```

## 📈 Monitoring & Maintenance

### Performance Monitoring

- **Vercel Analytics:** Built-in performance metrics
- **Speed Insights:** Core Web Vitals tracking
- **Custom API:** Application-specific analytics

### Database Maintenance

```bash
# Check database status
npx prisma migrate status

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

### Automatic Updates

The GitHub Actions workflow automatically:
- Runs quality checks on every PR
- Deploys previews for pull requests
- Deploys to production on main branch pushes
- Runs database migrations after deployment

## 🎯 Performance Expectations

### Target Metrics

- **Lighthouse Score:** 95+ across all metrics
- **Time to First Byte:** <200ms
- **First Contentful Paint:** <1.5s
- **Database Response:** <50ms (p95)
- **Edge Function Cold Start:** <100ms

### Optimization Features

- Global CDN distribution via Vercel Edge Network
- Automatic image optimization
- Code splitting and lazy loading
- Service worker caching
- Database connection pooling

## 🔗 Useful Resources

- [Vercel Documentation](https://vercel.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Postgres Guide](https://vercel.com/docs/storage/vercel-postgres)

## 🎉 Success Checklist

- [ ] ✅ Vercel project created and linked
- [ ] ✅ Environment variables configured
- [ ] ✅ Database created and migrated
- [ ] ✅ OAuth providers configured
- [ ] ✅ GitHub Actions secrets added
- [ ] ✅ Domain configured (if using custom domain)
- [ ] ✅ Health check endpoint responds correctly
- [ ] ✅ Authentication flow works
- [ ] ✅ Database operations function
- [ ] ✅ Analytics tracking active
- [ ] ✅ Performance metrics meet targets

Your Astral Turf tactical board application is now deployed to Vercel with enterprise-grade configuration! 🚀