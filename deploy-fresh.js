#!/usr/bin/env node

/**
 * Fresh Vercel Deployment Script for Astral Turf
 * Sets up a completely new Vercel project with all configurations
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up fresh Vercel deployment for Astral Turf...\n');

// Clean build and install dependencies
async function cleanInstall() {
  console.log('📦 Installing dependencies...');
  return new Promise((resolve, reject) => {
    exec('npm install', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to install dependencies:', error.message);
        reject(error);
        return;
      }
      console.log('✅ Dependencies installed successfully');
      resolve();
    });
  });
}

// Build the application
async function buildApp() {
  console.log('🔨 Building application...');
  return new Promise((resolve, reject) => {
    exec('npm run build', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Build failed:', error.message);
        console.error(stderr);
        reject(error);
        return;
      }
      console.log('✅ Application built successfully');
      resolve();
    });
  });
}

// Deploy to Vercel
async function deployToVercel() {
  console.log('🌍 Deploying to Vercel...');
  return new Promise((resolve, reject) => {
    // Use --confirm to skip interactive prompts
    const deployCommand = 'vercel deploy --prod --confirm';
    
    exec(deployCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error(stderr);
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
          deployment: {
            url: deploymentUrl,
            status: "successful",
            timestamp: new Date().toISOString(),
            platform: "Vercel",
            framework: "Vite",
            buildTime: "Fresh deployment",
            region: "iad1"
          },
          github: {
            repository: "https://github.com/Damatnic/ASTRAL_TURF",
            branch: "master"
          },
          application: {
            name: "Astral Turf",
            version: "8.0.0",
            description: "Enterprise-grade football management application"
          }
        };
        
        fs.writeFileSync(
          path.join(__dirname, 'deployment-info.json'),
          JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log('📝 Deployment info saved to deployment-info.json');
      }
      
      resolve(stdout);
    });
  });
}

// Set up environment variables
async function setupEnvironment() {
  console.log('⚙️ Setting up environment variables...');
  
  const envVars = [
    'NODE_ENV=production',
    'VITE_APP_NAME=Astral Turf',
    'VITE_APP_VERSION=8.0.0',
    'VITE_GEMINI_API_KEY=demo-api-key-for-development',
    'GEMINI_API_KEY=demo-api-key-for-development',
    'API_KEY=demo-api-key-for-development'
  ];
  
  for (const envVar of envVars) {
    await new Promise((resolve, reject) => {
      exec(`vercel env add ${envVar.split('=')[0]} production`, {
        input: envVar.split('=')[1] + '\n'
      }, (error) => {
        if (error && !error.message.includes('already exists')) {
          console.warn(`⚠️ Could not set ${envVar.split('=')[0]}:`, error.message);
        }
        resolve();
      });
    });
  }
  
  console.log('✅ Environment variables configured');
}

// Main deployment flow
async function main() {
  try {
    console.log('🎯 Astral Turf - Fresh Deployment Setup');
    console.log('🔧 Creating new Vercel project...\n');
    
    await cleanInstall();
    await buildApp();
    await deployToVercel();
    
    console.log('\n🎉 Fresh deployment completed successfully!');
    console.log('🏆 Astral Turf is now live on Vercel');
    console.log('📊 Monitor your deployment at https://vercel.com/dashboard');
    console.log('\n💡 Next steps:');
    console.log('   1. Update environment variables with real API keys');
    console.log('   2. Configure database connections');
    console.log('   3. Set up custom domain if needed');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Make sure Vercel CLI is installed: npm i -g vercel');
    console.log('   2. Login to Vercel: vercel login');
    console.log('   3. Try manual deployment: vercel --prod');
    process.exit(1);
  }
}

// Run deployment
main();