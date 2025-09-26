#!/usr/bin/env node

/**
 * Fully Automated Vercel Deployment Script for Astral Turf
 * This script automatically answers all prompts
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

// Utility function to run commands with automatic input
function runCommandWithInput(command, args = [], inputs = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: true,
    });

    let inputIndex = 0;

    // Send inputs automatically with delays
    const sendInputs = () => {
      if (inputIndex < inputs.length) {
        setTimeout(() => {
          child.stdin.write(inputs[inputIndex] + '\n');
          inputIndex++;
          sendInputs();
        }, 2000); // 2 second delay between inputs
      }
    };

    // Start sending inputs after a brief delay
    setTimeout(sendInputs, 3000);

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  log(`
🌟 ================================== 🌟
   ASTRAL TURF AUTO DEPLOYMENT
🌟 ================================== 🌟
`, colors.blue);

  try {
    // Step 1: Check if logged in
    logStep('Checking Vercel login status...');
    try {
      await new Promise((resolve, reject) => {
        const child = spawn('vercel', ['whoami'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true,
        });

        let output = '';
        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.on('close', (code) => {
          if (code === 0 && output.trim() && !output.includes('Error')) {
            resolve();
          } else {
            reject(new Error('Not logged in'));
          }
        });
      });

      logSuccess('Already logged in to Vercel');
    } catch (error) {
      logError('Not logged in to Vercel. Please run: vercel login');
      logError('Then run this script again.');
      process.exit(1);
    }

    // Step 2: Create vercel.json
    logStep('Creating vercel.json configuration...');
    const vercelConfig = {
      "name": "astral-turf",
      "version": 2,
      "builds": [
        {
          "src": "package.json",
          "use": "@vercel/static-build",
          "config": {
            "distDir": "dist",
          },
        },
      ],
      "routes": [
        {
          "src": "/health",
          "dest": "/api/health.js",
        },
        {
          "src": "/api/(.*)",
          "dest": "/api/$1.js",
        },
        {
          "src": "/(.*)",
          "dest": "/index.html",
        },
      ],
      "env": {
        "NODE_ENV": "production",
      },
    };

    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    logSuccess('Created vercel.json');

    // Step 3: Deploy with automatic inputs
    logStep('Starting automated deployment...');
    logWarning('Automatically providing responses:');
    logWarning('- Set up and deploy? Y');
    logWarning('- Project name: astral-turf');
    logWarning('- Directory: ./');

    const inputs = [
      'y',           // Set up and deploy?
      'astral-turf', // Project name
      './',          // Directory
      'n',            // Link to existing project? No, create new
    ];

    await runCommandWithInput('vercel', [], inputs);

    logSuccess('Deployment completed!');

    // Step 4: Show deployment info
    log(`
🎉 DEPLOYMENT SUCCESSFUL! 🎉

📱 Your application should now be deployed to Vercel!

🔧 IMPORTANT: Set Environment Variables
1. Go to: https://vercel.com/dashboard
2. Find your "astral-turf" project
3. Go to Settings > Environment Variables
4. Add these REQUIRED variables:

DATABASE_URL=postgresql://neondb_owner:npg_z3tIi9kCFDxB@ep-twilight-poetry-adqdke5a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=astral-turf-super-secure-jwt-secret-key-2024-production-v8
NODE_ENV=production
GEMINI_API_KEY=your-gemini-api-key-here

📋 For all environment variables, copy from: vercel-env-template.txt

🚀 After setting environment variables:
   vercel --prod

📊 Check deployment status:
   vercel ls
   vercel logs
`, colors.green);

  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    logError('');
    logError('Manual deployment steps:');
    logError('1. Run: vercel login');
    logError('2. Run: vercel');
    logError('3. Answer prompts:');
    logError('   - Set up and deploy? Y');
    logError('   - Project name: astral-turf');
    logError('   - Directory: ./');
    logError('   - Link existing? N');
    logError('');
    process.exit(1);
  }
}

// Handle script interruption
process.on('SIGINT', () => {
  logWarning('\nDeployment interrupted by user');
  process.exit(1);
});

// Run the deployment
main().catch(console.error);
