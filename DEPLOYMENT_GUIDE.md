# Deployment Guide - Astral Turf

Complete deployment guide for Astral Turf to various platforms.

---

## Table of Contents

- [Production Build](#production-build)
- [Vercel Deployment](#vercel-deployment)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)
- [Performance Checklist](#performance-checklist)
- [Troubleshooting](#troubleshooting)

---

## Production Build

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Git (for version control)

### Build Process

```bash
# Install dependencies
npm install

# Run tests to ensure everything works
npm run test:run

# Type check
npm run type-check

# Create production build
npm run build

# Analyze bundle (optional)
node scripts/analyze-bundle.js
```

### Build Output

The production build creates:
- `dist/index.html` - Entry HTML file
- `dist/js/` - JavaScript bundles (code-split)
- `dist/assets/` - CSS and static assets

**Expected Metrics**:
- Build Time: ~5-6 seconds
- Total Bundle (gzipped): ~31 KB
- Compression Ratio: ~88%
- Code Chunks: ~20 files

---

## Vercel Deployment

### Quick Deploy

**Option 1: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Option 2: GitHub Integration**

1. Push code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Click "Deploy"

### Vercel Configuration

The project includes `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "devCommand": "npm run vite:dev"
}
```

### Environment Variables

Set in Vercel Dashboard (Settings → Environment Variables):

```
VITE_API_URL=https://api.yourdomain.com
VITE_OPENAI_API_KEY=your-openai-key
```

---

## Manual Deployment

### Static Hosting

For static hosts (Netlify, GitHub Pages, etc.):

```bash
# Build the project
npm run build

# Deploy the dist/ folder
# Upload dist/ contents to your hosting provider
```

### Nginx Configuration

Example nginx config:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/astral-turf/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### Apache Configuration

Example .htaccess:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
  AddOutputFilterByType DEFLATE application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## Environment Variables

### Development

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_OPENAI_API_KEY=your-dev-key
VITE_ENABLE_DEVTOOLS=true
```

### Production

Set in hosting provider dashboard:

```env
VITE_API_URL=https://api.production.com
VITE_OPENAI_API_KEY=your-production-key
VITE_ENABLE_DEVTOOLS=false
VITE_ANALYTICS_ID=your-analytics-id
```

### Environment Variable Access

In code:

```tsx
const apiUrl = import.meta.env.VITE_API_URL;
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
```

---

## Performance Checklist

### Pre-Deployment

- [ ] **Build passes** - `npm run build` completes without errors
- [ ] **Tests pass** - `npm run test:run` all green
- [ ] **Type check** - `npm run type-check` no errors
- [ ] **Bundle analysis** - Check bundle sizes acceptable
- [ ] **Performance score** - 85+ score from bundle analyzer
- [ ] **Zero console errors** - No errors in production build

### Post-Deployment

- [ ] **Lighthouse score** - 90+ performance
- [ ] **Web Vitals** - LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] **Gzip enabled** - Check network tab shows compressed files
- [ ] **Cache headers** - Static assets cached properly
- [ ] **Security headers** - CSP, HSTS, X-Frame-Options set
- [ ] **Mobile responsive** - Test on various screen sizes
- [ ] **Accessibility** - Screen reader compatible

### Monitoring

```bash
# Run Lighthouse
npx lighthouse https://yourdomain.com --view

# Check bundle sizes
node scripts/analyze-bundle.js

# Run performance tests
npm run test:performance
```

---

## Production Optimization

### Compression

**Vite automatically handles**:
- JavaScript minification (esbuild)
- CSS minification (esbuild)
- Tree shaking
- Code splitting

**Server-side**:
- Enable Gzip/Brotli compression
- Set proper cache headers
- Use HTTP/2 or HTTP/3

### CDN Configuration

For optimal performance:

1. **Static Assets**:
   - Upload `dist/assets/` to CDN
   - Update asset references if needed

2. **Cache Strategy**:
   - HTML: `no-cache` (always validate)
   - JS/CSS: `max-age=31536000` (1 year)
   - Images: `max-age=31536000` (1 year)

3. **Headers**:
   ```
   Cache-Control: public, max-age=31536000, immutable
   ```

---

## Troubleshooting

### Build Failures

**Issue**: Build fails with memory errors

```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

**Issue**: Missing dependencies

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Runtime Errors

**Issue**: "Module not found" in production

- Check import paths (use aliases from vite.config.ts)
- Ensure all files are committed to git
- Verify case-sensitive file names

**Issue**: Environment variables not working

- Prefix with `VITE_`
- Rebuild after changing env vars
- Check hosting provider env var settings

### Performance Issues

**Issue**: Large bundle size

```bash
# Analyze bundle
node scripts/analyze-bundle.js

# Check for:
# - Large dependencies
# - Duplicated code
# - Missing code splitting
```

**Issue**: Slow load times

- Enable CDN
- Check server response times
- Verify compression enabled
- Use `npm run test:performance`

---

## Deployment Scripts

### Custom Deploy Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Run tests
echo "Running tests..."
npm run test:run || exit 1

# Type check
echo "Type checking..."
npm run type-check || exit 1

# Build
echo "Building..."
npm run build || exit 1

# Analyze
echo "Analyzing bundle..."
node scripts/analyze-bundle.js

echo "✅ Deployment ready!"
```

Make executable:
```bash
chmod +x scripts/deploy.sh
```

Run:
```bash
./scripts/deploy.sh
```

### CI/CD Pipeline

**GitHub Actions** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm run test:run
      
    - name: Type check
      run: npm run type-check
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

---

## Post-Deployment Validation

### Checklist

```bash
# 1. Check deployment URL loads
curl -I https://yourdomain.com

# 2. Verify gzip compression
curl -I -H "Accept-Encoding: gzip" https://yourdomain.com

# 3. Test API endpoints
curl https://yourdomain.com/api/health

# 4. Run Lighthouse
npx lighthouse https://yourdomain.com

# 5. Check security headers
curl -I https://yourdomain.com | grep -i "security\|frame\|xss"
```

### Performance Monitoring

Set up monitoring:

1. **Google Analytics** - User behavior
2. **Sentry** - Error tracking
3. **Web Vitals** - Performance metrics
4. **Uptime Monitors** - Availability tracking

---

## Support

For deployment issues:
- Check build logs
- Review console errors
- Consult hosting provider docs
- Open GitHub issue

---

**Deployment Guide Version**: 1.0  
**Last Updated**: October 6, 2025
