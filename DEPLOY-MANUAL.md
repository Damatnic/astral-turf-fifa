# 🚀 Manual Vercel Deployment Steps

Follow these exact steps to deploy Astral Turf to Vercel:

## Step 1: Login to Vercel
```bash
vercel login
```
- This will open your browser
- Login with your GitHub/GitLab/Bitbucket account
- Come back to terminal when done

## Step 2: Deploy the Project
```bash
vercel
```

When prompted, answer:
- **Set up and deploy "~\_REPOS\Astral Turf"?** → Type `y` and press Enter
- **Which scope should contain your project?** → Select your account (usually first option)
- **Link to existing project?** → Type `n` and press Enter
- **What's your project's name?** → Type `astral-turf` and press Enter
- **In which directory is your code located?** → Type `./` and press Enter

## Step 3: Wait for Deployment
The deployment will start automatically. You'll see:
- Building your project
- Uploading files
- Final deployment URL

## Step 4: Set Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your "astral-turf" project
3. Go to **Settings** → **Environment Variables**
4. Add these variables one by one:

### Required Variables:
```
DATABASE_URL=postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=astral-turf-super-secure-jwt-secret-key-2024-production-v8
NODE_ENV=production
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

### Additional Variables (recommended):
```
APP_VERSION=8.0.0
POSTGRES_URL=postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech
POSTGRES_PASSWORD=npg_z3tIi9kCFDxB
POSTGRES_DATABASE=neondb
JWT_ROTATION_INTERVAL_HOURS=24
JWT_GRACE_PERIOD_HOURS=2
LOG_LEVEL=info
ENABLE_AI_FEATURES=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_ANALYTICS=true
ENABLE_ERROR_TRACKING=true
```

## Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

## Step 6: Test Your Deployment

1. Visit your deployment URL (shown in terminal)
2. Test the health endpoint: `https://your-app.vercel.app/health`
3. Test the main application: `https://your-app.vercel.app`

## Troubleshooting

### If deployment fails:
```bash
# Check logs
vercel logs

# Try redeploying
vercel --prod

# Check project status
vercel ls
```

### If environment variables aren't working:
1. Make sure they're set for "Production" environment
2. Redeploy after adding variables
3. Check for typos in variable names

### If health check fails:
- Wait 2-3 minutes for cold start
- Check database connection
- Verify all required environment variables are set

## Success Indicators

✅ **Deployment URL works**
✅ **Health endpoint returns {"status": "healthy"}**
✅ **Main application loads**
✅ **Database connection works**
✅ **Authentication works**

## Next Steps

1. **Custom Domain**: Add your domain in Vercel dashboard
2. **Monitoring**: Set up error tracking
3. **Analytics**: Configure usage analytics
4. **Backup**: Set up database backups

---

## Quick Commands Reference

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Remove deployment
vercel rm astral-turf

# Check who you're logged in as
vercel whoami

# Logout
vercel logout
```

---

**Need help?** Check the [Vercel Documentation](https://vercel.com/docs) or the main [DEPLOYMENT.md](./DEPLOYMENT.md) file.
