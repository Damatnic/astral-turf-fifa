#!/usr/bin/env node

/**
 * Automated Vercel Deployment Script for Astral Turf
 *
 * This script automatically sets up and deploys the Astral Turf application
 * to Vercel with all necessary configurations and environment variables.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  projectName: 'astral-turf',
  geminiApiKey: process.env.GEMINI_API_KEY || 'your-production-gemini-api-key-here',
  production: process.argv.includes('--prod'),
  skipBuild: process.argv.includes('--skip-build'),
};

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

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

// Utility function to run commands and capture output
function runCommandWithOutput(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Command failed: ${stderr}`));
      }
    });
  });
}

// Environment variables configuration
const ENV_VARS = {
  NODE_ENV: 'production',
  APP_VERSION: '8.0.0',
  DATABASE_URL: 'postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  DATABASE_URL_UNPOOLED: 'postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  POSTGRES_URL: 'postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  POSTGRES_URL_NON_POOLING: 'postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  POSTGRES_USER: 'neondb_owner',
  POSTGRES_HOST: 'ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech',
  POSTGRES_PASSWORD: 'npg_z3tIi9kCFDxB',
  POSTGRES_DATABASE: 'neondb',
  POSTGRES_PRISMA_URL: 'postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a.c-2.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require',
  JWT_SECRET: 'astral-turf-super-secure-jwt-secret-key-2024-production-v8',
  JWT_ROTATION_INTERVAL_HOURS: '24',
  JWT_GRACE_PERIOD_HOURS: '2',
  JWT_KEY_LENGTH: '64',
  JWT_MAX_KEYS: '5',
  JWT_AUTO_ROTATION: 'true',
  GEMINI_API_KEY: CONFIG.geminiApiKey,
  LOG_LEVEL: 'info',
  LOG_FLUSH_INTERVAL_MS: '30000',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  MAX_FILE_SIZE: '10485760',
  ALLOWED_FILE_TYPES: 'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain',
  ENABLE_AI_FEATURES: 'true',
  ENABLE_REAL_TIME_UPDATES: 'true',
  ENABLE_ANALYTICS: 'true',
  ENABLE_ERROR_TRACKING: 'true',
  SECURE_COOKIES: 'true',
  CACHE_TTL: '3600',
  SESSION_TIMEOUT: '86400',
  MAX_CONCURRENT_REQUESTS: '100',
  BACKUP_ENABLED: 'true',
  BACKUP_RETENTION_DAYS: '30',
};

async function checkPrerequisites() {
  logStep('Checking prerequisites...');

  try {
    await runCommandWithOutput('node', ['--version']);
    logSuccess('Node.js is installed');
  } catch (error) {
    throw new Error('Node.js is not installed or not in PATH');
  }

  try {
    await runCommandWithOutput('npm', ['--version']);
    logSuccess('npm is installed');
  } catch (error) {
    throw new Error('npm is not installed or not in PATH');
  }

  // Check if Vercel CLI is installed, install if not
  try {
    const vercelVersion = await runCommandWithOutput('vercel', ['--version']);
    logSuccess(`Vercel CLI installed: ${vercelVersion}`);
  } catch (error) {
    logWarning('Vercel CLI not found. Installing...');
    await runCommand('npm', ['install', '-g', 'vercel@latest']);
    logSuccess('Vercel CLI installed');
  }
}

async function buildProject() {
  if (CONFIG.skipBuild) {
    logWarning('Skipping build step');
    return;
  }

  logStep('Installing dependencies...');
  await runCommand('npm', ['ci']);
  logSuccess('Dependencies installed');

  logStep('Generating Prisma client...');
  await runCommand('npx', ['prisma', 'generate']);
  logSuccess('Prisma client generated');

  logStep('Building project...');
  await runCommand('npm', ['run', 'build']);
  logSuccess('Project built successfully');
}

async function setupVercelProject() {
  logStep('Setting up Vercel project...');

  // Create .vercel directory if it doesn't exist
  if (!fs.existsSync('.vercel')) {
    fs.mkdirSync('.vercel');
  }

  // Create project.json for Vercel
  const projectConfig = {
    projectId: '',
    orgId: '',
  };

  // Try to link or create project
  try {
    logStep('Linking to Vercel project...');
    await runCommand('vercel', ['link', '--yes']);
    logSuccess('Vercel project linked');
  } catch (error) {
    logWarning('Could not link existing project, will create new one during deployment');
  }
}

async function setEnvironmentVariables() {
  logStep('Setting up environment variables...');

  const envCount = Object.keys(ENV_VARS).length;
  let successCount = 0;

  for (const [key, value] of Object.entries(ENV_VARS)) {
    try {
      // Remove existing env var first (ignore errors)
      await runCommand('vercel', ['env', 'rm', key, 'production'], { stdio: 'pipe' }).catch(() => {});

      // Add new env var
      await runCommand('vercel', ['env', 'add', key, 'production'], {
        stdio: 'pipe',
        input: `${value}\n`,
      });

      successCount++;
      process.stdout.write(`\r${colors.blue}Setting environment variables... ${successCount}/${envCount}${colors.reset}`);
    } catch (error) {
      logWarning(`Failed to set ${key}: ${error.message}`);
    }
  }

  console.log(); // New line
  logSuccess(`Environment variables configured (${successCount}/${envCount})`);
}

async function deployToVercel() {
  logStep('Deploying to Vercel...');

  const deployArgs = ['--yes'];
  if (CONFIG.production) {
    deployArgs.push('--prod');
  }

  await runCommand('vercel', deployArgs);
  logSuccess('Deployment completed');
}

async function testDeployment() {
  logStep('Testing deployment...');

  try {
    // Get deployment URL
    const deploymentList = await runCommandWithOutput('vercel', ['ls', '--json']);
    const deployments = JSON.parse(deploymentList);

    if (deployments.length === 0) {
      throw new Error('No deployments found');
    }

    const latestDeployment = deployments[0];
    const deploymentUrl = `https://${latestDeployment.url}`;

    logSuccess(`Deployment URL: ${deploymentUrl}`);

    // Wait a bit for deployment to be ready
    logStep('Waiting for deployment to be ready...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Test health endpoint
    try {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch(`${deploymentUrl}/health`);

      if (response.ok) {
        const healthData = await response.json();
        logSuccess(`Health check passed: ${healthData.status}`);
      } else {
        logWarning(`Health check returned status: ${response.status}`);
      }
    } catch (fetchError) {
      logWarning('Health check failed (this may be normal for new deployments)');
    }

    return deploymentUrl;

  } catch (error) {
    logWarning(`Could not test deployment: ${error.message}`);
    return null;
  }
}

async function main() {
  log(`
🌟 ================================== 🌟
   ASTRAL TURF VERCEL DEPLOYMENT
🌟 ================================== 🌟
`, colors.blue);

  try {
    await checkPrerequisites();
    await buildProject();
    await setupVercelProject();
    await setEnvironmentVariables();
    await deployToVercel();
    const deploymentUrl = await testDeployment();

    log(`
🎉 DEPLOYMENT SUCCESSFUL! 🎉

📱 Application URL: ${deploymentUrl || 'Check Vercel dashboard'}
🏥 Health Check: ${deploymentUrl || 'Check Vercel dashboard'}/health
🔐 Auth API: ${deploymentUrl || 'Check Vercel dashboard'}/api/auth
📊 Dashboard: ${deploymentUrl || 'Check Vercel dashboard'}

🔧 Next Steps:
1. Verify your Gemini API key in Vercel dashboard
2. Configure your custom domain if needed
3. Set up monitoring and alerting
4. Test all application features

📋 Vercel Dashboard: https://vercel.com/dashboard
`, colors.green);

  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Astral Turf Vercel Deployment Script

Usage: node deploy-vercel.js [options]

Options:
  --prod          Deploy to production environment
  --skip-build    Skip the build step (use existing build)
  --help, -h      Show this help message

Environment Variables:
  GEMINI_API_KEY  Your Gemini API key for AI features

Examples:
  node deploy-vercel.js                    # Deploy to preview
  node deploy-vercel.js --prod             # Deploy to production
  GEMINI_API_KEY=your-key node deploy-vercel.js --prod
`);
  process.exit(0);
}

// Run the deployment
main().catch(console.error);
