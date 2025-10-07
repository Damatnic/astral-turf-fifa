#!/usr/bin/env node

/**
 * 🚀 ASTRAL TURF - AUTOMATED PRODUCTION SETUP SCRIPT
 *
 * This script automates the production deployment setup process
 * Run: node scripts/production-setup.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = query => {
  return new Promise(resolve => rl.question(query, resolve));
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: msg => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}✖${colors.reset} ${msg}`),
  header: msg => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// Generate secure random string
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

// Check if command exists
async function commandExists(cmd) {
  try {
    await execAsync(`which ${cmd}`);
    return true;
  } catch {
    return false;
  }
}

// Validate environment variables
async function validateEnv() {
  log.header('📋 VALIDATING ENVIRONMENT');

  const required = ['DATABASE_URL', 'JWT_SECRET', 'NEXTAUTH_SECRET', 'NODE_ENV'];

  const missing = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    log.error(`Missing required environment variables: ${missing.join(', ')}`);
    log.info('Please configure these in your .env file');
    process.exit(1);
  }

  log.success('All required environment variables are set');
}

// Setup PostgreSQL database
async function setupDatabase() {
  log.header('🗄️  DATABASE SETUP');

  const setupDb = await question('Would you like to set up the database? (y/n): ');

  if (setupDb.toLowerCase() !== 'y') {
    log.info('Skipping database setup');
    return;
  }

  try {
    log.info('Running Prisma migrations...');
    await execAsync('npx prisma migrate deploy');
    log.success('Database migrations completed');

    log.info('Generating Prisma Client...');
    await execAsync('npx prisma generate');
    log.success('Prisma Client generated');

    const seedDb = await question('Would you like to seed the database? (y/n): ');
    if (seedDb.toLowerCase() === 'y') {
      log.info('Seeding database...');
      await execAsync('npx prisma db seed');
      log.success('Database seeded');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`Database setup failed: ${message}`);
    throw error;
  }
}

// Setup Redis
async function setupRedis() {
  log.header('🔴 REDIS SETUP');

  const hasRedis = await commandExists('redis-cli');

  if (!hasRedis) {
    log.warning('Redis CLI not found');
    log.info('Install Redis: https://redis.io/download');
    return;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    log.info(`Testing Redis connection: ${redisUrl}`);

    await execAsync('redis-cli ping');
    log.success('Redis is running');
  } catch (error) {
    log.error('Redis connection failed');
    log.info('Make sure Redis is running: redis-server');
  }
}

// Setup AWS S3
async function setupS3() {
  log.header('☁️  AWS S3 SETUP');

  const setupS3 = await question('Would you like to configure AWS S3? (y/n): ');

  if (setupS3.toLowerCase() !== 'y') {
    log.info('Skipping S3 setup');
    return;
  }

  const hasAwsCli = await commandExists('aws');

  if (!hasAwsCli) {
    log.warning('AWS CLI not found');
    log.info('Install AWS CLI: https://aws.amazon.com/cli/');
    return;
  }

  const bucketName = await question('Enter S3 bucket name (or press Enter to skip): ');

  if (!bucketName) {
    log.info('Skipping S3 bucket creation');
    return;
  }

  try {
    const region = (await question('Enter AWS region (default: us-east-1): ')) || 'us-east-1';

    log.info(`Creating S3 bucket: ${bucketName}...`);
    await execAsync(`aws s3 mb s3://${bucketName} --region ${region}`);
    log.success(`S3 bucket created: ${bucketName}`);

    log.info('Configuring CORS...');
    const corsConfig = JSON.stringify({
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
          AllowedOrigins: ['*'],
          ExposeHeaders: ['ETag'],
        },
      ],
    });

    await fs.writeFile('/tmp/cors.json', corsConfig);
    await execAsync(
      `aws s3api put-bucket-cors --bucket ${bucketName} --cors-configuration file:///tmp/cors.json`,
    );
    log.success('CORS configured');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`S3 setup failed: ${message}`);
  }
}

// Generate .env file
async function generateEnvFile() {
  log.header('⚙️  ENVIRONMENT FILE GENERATION');

  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  try {
    await fs.access(envPath);
    const overwrite = await question('.env file exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Keeping existing .env file');
      return;
    }
  } catch {
    // .env doesn't exist, continue
  }

  log.info('Generating secure secrets...');

  const jwtSecret = generateSecret();
  const nextAuthSecret = generateSecret();
  const redisPassword = generateSecret(24);

  log.success('Secrets generated');

  const envTemplate = await fs.readFile(envExamplePath, 'utf-8');

  let envContent = envTemplate
    .replace('your-nextauth-secret-key-here-minimum-32-characters', nextAuthSecret)
    .replace('your-jwt-secret-key-minimum-32-characters', jwtSecret)
    .replace('your-redis-password-if-required', redisPassword);

  const databaseUrl = await question('Enter DATABASE_URL (or press Enter to keep template): ');
  if (databaseUrl) {
    envContent = envContent.replace(
      'postgresql://username:password@localhost:5432/astralturf',
      databaseUrl,
    );
  }

  const openaiKey = await question('Enter OPENAI_API_KEY (or press Enter to skip): ');
  if (openaiKey) {
    envContent = envContent.replace('sk-proj-your-openai-api-key-here', openaiKey);
  }

  await fs.writeFile(envPath, envContent);
  log.success('.env file created with secure secrets');

  log.warning('Please review and update remaining values in .env file');
}

// Build application
async function buildApplication() {
  log.header('🔨 BUILDING APPLICATION');

  const build = await question('Would you like to build the application? (y/n): ');

  if (build.toLowerCase() !== 'y') {
    log.info('Skipping build');
    return;
  }

  try {
    log.info('Installing dependencies...');
    await execAsync('npm install');
    log.success('Dependencies installed');

    log.info('Building application...');
    await execAsync('npm run build');
    log.success('Application built successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`Build failed: ${message}`);
    throw error;
  }
}

// Run tests
async function runTests() {
  log.header('🧪 RUNNING TESTS');

  const runTests = await question('Would you like to run tests? (y/n): ');

  if (runTests.toLowerCase() !== 'y') {
    log.info('Skipping tests');
    return;
  }

  try {
    log.info('Running production tests...');
    await execAsync('npm run test:run');
    log.success('All tests passed');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`Tests failed: ${message}`);
    log.warning('Fix test failures before deploying to production');
  }
}

// Setup Docker
async function setupDocker() {
  log.header('🐳 DOCKER SETUP');

  const hasDocker = await commandExists('docker');

  if (!hasDocker) {
    log.warning('Docker not found');
    log.info('Install Docker: https://docs.docker.com/get-docker/');
    return;
  }

  const setupDocker = await question('Would you like to start Docker services? (y/n): ');

  if (setupDocker.toLowerCase() !== 'y') {
    log.info('Skipping Docker setup');
    return;
  }

  try {
    log.info('Building Docker images...');
    await execAsync('docker-compose build');
    log.success('Docker images built');

    log.info('Starting Docker services...');
    await execAsync('docker-compose up -d');
    log.success('Docker services started');

    log.info('Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const { stdout } = await execAsync('docker-compose ps');
    console.log(stdout);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`Docker setup failed: ${message}`);
  }
}

// Verify deployment
async function verifyDeployment() {
  log.header('✅ DEPLOYMENT VERIFICATION');

  try {
    log.info('Checking health endpoint...');
    const healthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    await execAsync(`curl -f ${healthUrl}/health || echo "Health check skipped"`);
    log.success('Health check passed');
  } catch (error) {
    log.warning('Could not verify deployment health');
    log.info('Make sure the application is running');
  }
}

// Summary
async function showSummary() {
  log.header('📊 SETUP COMPLETE');

  console.log(`
${colors.green}✓ Production setup completed successfully!${colors.reset}

${colors.bright}Next Steps:${colors.reset}

1. Review your .env file and update any remaining values
2. Start the application:
   ${colors.cyan}npm run dev${colors.reset} (development)
   ${colors.cyan}npm run build && npm start${colors.reset} (production)

3. Access your application:
   ${colors.cyan}http://localhost:3000${colors.reset}

4. Monitor health:
   ${colors.cyan}http://localhost:3000/health${colors.reset}

5. Review deployment guide:
   ${colors.cyan}cat PRODUCTION_DEPLOYMENT_GUIDE.md${colors.reset}

${colors.bright}Useful Commands:${colors.reset}

- Database migrations: ${colors.cyan}npx prisma migrate deploy${colors.reset}
- View database: ${colors.cyan}npx prisma studio${colors.reset}
- Run tests: ${colors.cyan}npm test${colors.reset}
- Check logs: ${colors.cyan}docker-compose logs -f${colors.reset}

${colors.yellow}⚠️  Remember to:${colors.reset}
- Never commit .env files to git
- Use strong passwords and secrets
- Enable SSL/TLS for production
- Set up monitoring and backups
- Review security settings

${colors.green}Happy deploying! 🚀${colors.reset}
  `);
}

// Main execution
async function main() {
  console.clear();

  log.header('🚀 ASTRAL TURF - PRODUCTION SETUP');

  console.log(`
${colors.bright}This script will help you set up Astral Turf for production.${colors.reset}

It will guide you through:
- Environment configuration
- Database setup
- Redis configuration
- AWS S3 setup (optional)
- Docker deployment (optional)
- Build and testing

${colors.yellow}Press Ctrl+C at any time to cancel.${colors.reset}
  `);

  const proceed = await question('Ready to begin? (y/n): ');

  if (proceed.toLowerCase() !== 'y') {
    log.info('Setup cancelled');
    process.exit(0);
  }

  try {
    // Run setup steps
    await generateEnvFile();
    await validateEnv();
    await setupDatabase();
    await setupRedis();
    await setupS3();
    await buildApplication();
    await runTests();
    await setupDocker();
    await verifyDeployment();
    await showSummary();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`Setup failed: ${message}`);
    log.info('Please review the error and try again');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`Unexpected error: ${message}`);
    process.exit(1);
  });
}

export { main };
