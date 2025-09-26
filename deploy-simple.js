#!/usr/bin/env node

/**
 * Simple Vercel Deployment Script for Astral Turf
 * Fixed version that handles common deployment issues
 */

const { spawn } = require('child_process');
const fs = require('fs');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(message) {
  log(`🚀 ${message}`, colors.blue);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

// Utility function to run commands
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    child.on('close', code => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function main() {
  log(
    `
🌟 ================================== 🌟
   ASTRAL TURF SIMPLE DEPLOYMENT
🌟 ================================== 🌟
`,
    colors.blue
  );

  try {
    // Step 1: Login to Vercel
    logStep('Logging into Vercel...');
    try {
      await runCommand('vercel', ['whoami']);
      logSuccess('Already logged in to Vercel');
    } catch (error) {
      logWarning('Not logged in, please login when prompted...');
      await runCommand('vercel', ['login']);
      logSuccess('Logged in to Vercel');
    }

    // Step 2: Create a simple vercel.json if it doesn't exist
    if (!fs.existsSync('vercel.json')) {
      logStep('Creating vercel.json configuration...');
      const vercelConfig = {
        name: 'astral-turf',
        version: 2,
        builds: [
          {
            src: 'package.json',
            use: '@vercel/static-build',
            config: {
              distDir: 'dist',
            },
          },
        ],
        routes: [
          {
            src: '/health',
            dest: '/api/health.js',
          },
          {
            src: '/api/(.*)',
            dest: '/api/$1.js',
          },
          {
            src: '/(.*)',
            dest: '/index.html',
          },
        ],
      };
      fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
      logSuccess('Created vercel.json');
    }

    // Step 3: Deploy with simple command
    logStep('Deploying to Vercel...');
    logWarning('When prompted:');
    logWarning('- Project name: astral-turf (no spaces)');
    logWarning('- Directory: ./ (current directory)');
    logWarning('- Link to existing project: N (create new)');

    await runCommand('vercel', ['--name', 'astral-turf']);

    logSuccess('Deployment initiated!');

    // Step 4: Show next steps
    log(
      `
🎉 DEPLOYMENT STARTED! 🎉

📋 Next Steps:
1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Find your "astral-turf" project
3. Go to Settings > Environment Variables
4. Add the following environment variables:

REQUIRED VARIABLES:
- DATABASE_URL=postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
- JWT_SECRET=astral-turf-super-secure-jwt-secret-key-2024-production-v8
- NODE_ENV=production
- GEMINI_API_KEY=your-gemini-api-key-here

OPTIONAL VARIABLES (copy from vercel-env-template.txt):
- All other environment variables for full functionality

5. Redeploy after adding environment variables
6. Test your application at the provided URL

🔧 To redeploy after setting env vars:
   vercel --prod

📊 Monitor your deployment:
   vercel logs
`,
      colors.green
    );
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    logError('');
    logError('Troubleshooting steps:');
    logError('1. Make sure you have a Vercel account');
    logError('2. Check your internet connection');
    logError('3. Try running: vercel login');
    logError('4. Try running: vercel --help');
    logError('');
    process.exit(1);
  }
}

// Run the deployment
main().catch(console.error);
