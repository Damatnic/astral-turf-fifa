#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Script
 * Sets up minimal demo configuration for Astral Turf deployment
 */

const { execSync } = require('child_process');
const crypto = require('crypto');

// Generate secure random secrets
const generateSecret = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Essential environment variables for demo
const envVars = {
  NODE_ENV: 'production',
  JWT_SECRET: generateSecret(32),
  DATABASE_URL: 'postgresql://demo:demo@localhost:5432/astral_turf_demo?schema=public',
  POSTGRES_PRISMA_URL:
    'postgresql://demo:demo@localhost:5432/astral_turf_demo?schema=public&pgbouncer=true',
};

console.log('🚀 Setting up Vercel environment variables for Astral Turf demo...\n');

function setVercelEnvVar(key, value, environment = 'production') {
  try {
    console.log(`Setting ${key}...`);

    // Using vercel env add with echo to pipe the value
    const command = `echo "${value}" | vercel env add ${key} ${environment}`;
    execSync(command, { stdio: 'inherit' });

    console.log(`✅ ${key} set successfully`);
  } catch (error) {
    console.error(`❌ Failed to set ${key}:`, error.message);
  }
}

async function setupEnvironment() {
  console.log('Setting up minimal demo environment variables:\n');

  for (const [key, value] of Object.entries(envVars)) {
    setVercelEnvVar(key, value);
    console.log(''); // Empty line for readability
  }

  console.log('🎉 Environment setup complete!');
  console.log('\n📝 Note: For full functionality, set up Vercel Postgres database in dashboard');
  console.log('🔗 Visit: https://vercel.com/dashboard to configure additional services');
}

if (require.main === module) {
  setupEnvironment().catch(console.error);
}

module.exports = { setupEnvironment, envVars };
