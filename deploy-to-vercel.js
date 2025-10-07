#!/usr/bin/env node

/**
 * Automated Vercel Deployment Script for Astral Turf
 * Connects GitHub repository to Vercel and deploys application
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Astral Turf Vercel Deployment...');

// Check if vercel CLI is installed
function checkVercelCLI() {
  return new Promise(resolve => {
    exec('vercel --version', error => {
      if (error) {
        console.log('📦 Installing Vercel CLI...');
        exec('npm install -g vercel', installError => {
          if (installError) {
            console.error('❌ Failed to install Vercel CLI:', installError.message);
            process.exit(1);
          }
          console.log('✅ Vercel CLI installed successfully');
          resolve();
        });
      } else {
        console.log('✅ Vercel CLI is already installed');
        resolve();
      }
    });
  });
}

// Deploy to Vercel
function deployToVercel() {
  return new Promise((resolve, reject) => {
    console.log('🌍 Deploying to Vercel...');

    // Deploy with production settings
    const deployCommand = 'vercel --prod --yes --confirm';

    exec(deployCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Deployment failed:', error.message);
        reject(error);
        return;
      }

      console.log('✅ Deployment successful!');
      console.log(stdout);

      // Extract URL from output
      const urlMatch = stdout.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        const deploymentUrl = urlMatch[0];
        console.log(`🌐 Application deployed to: ${deploymentUrl}`);

        // Save deployment info
        const deploymentInfo = {
          url: deploymentUrl,
          timestamp: new Date().toISOString(),
          version: require('./package.json').version,
        };

        fs.writeFileSync(
          path.join(__dirname, 'deployment-info.json'),
          JSON.stringify(deploymentInfo, null, 2),
        );

        console.log('📝 Deployment info saved to deployment-info.json');
      }

      resolve(stdout);
    });
  });
}

// Setup project configuration
function setupProject() {
  console.log('⚙️ Setting up project configuration...');

  // Ensure build script exists
  const packageJson = require('./package.json');
  if (!packageJson.scripts.build) {
    console.error('❌ Build script not found in package.json');
    process.exit(1);
  }

  console.log('✅ Project configuration validated');
}

// Main deployment flow
async function main() {
  try {
    console.log('🎯 Astral Turf - Enterprise Football Management Platform');
    console.log('🔧 Preparing for production deployment...\n');

    setupProject();
    await checkVercelCLI();
    await deployToVercel();

    console.log('\n🎉 Deployment completed successfully!');
    console.log('🏆 Astral Turf is now live on Vercel');
    console.log('📊 Monitor your deployment at https://vercel.com/dashboard');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
main();
