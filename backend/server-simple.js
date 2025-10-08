/**
 * Simple Express Server for Astral Turf Backend
 * This bypasses NestJS complexity and runs a clean HTTP server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Import NestJS compiled app
let nestApp;

async function bootstrap() {
  try {
    console.log('🔄 Loading NestJS application...');
    
    // Import the compiled NestJS application
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/app.module');
    const { ValidationPipe } = require('@nestjs/common');
    const { ConfigService } = require('@nestjs/config');

    // Create NestJS application with Express adapter
    nestApp = await NestFactory.create(AppModule, { 
      logger: ['error', 'warn', 'log'],
    });

    const configService = nestApp.get(ConfigService);

    // Global validation
    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );

    // Set global prefix
    nestApp.setGlobalPrefix(process.env.API_PREFIX || 'api');

    // Enable CORS
    nestApp.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    });

    // Initialize NestJS app
    await nestApp.init();

    console.log('✅ NestJS application loaded successfully');
    console.log(`📋 API Prefix: /${process.env.API_PREFIX || 'api'}`);
    console.log(`🔗 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

    return nestApp;
  } catch (error) {
    console.error('❌ Failed to load NestJS application:', error);
    throw error;
  }
}

// Mount NestJS app to Express
async function setupServer() {
  try {
    // Initialize NestJS
    const nest = await bootstrap();
    
    // Get Express instance from NestJS
    const nestExpressApp = nest.getHttpAdapter().getInstance();
    
    // Mount NestJS routes under Express
    app.use('/', nestExpressApp);

    console.log('✅ NestJS routes mounted to Express server');
  } catch (error) {
    console.error('❌ Server setup failed:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    // Setup NestJS integration
    await setupServer();

    // Start listening
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 Astral Turf Backend Server Started Successfully!');
      console.log('='.repeat(60));
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/${process.env.API_PREFIX || 'api'}`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
      console.log('='.repeat(60) + '\n');
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n🛑 SIGTERM received, shutting down gracefully...');
      if (nestApp) {
        await nestApp.close();
      }
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('\n🛑 SIGINT received, shutting down gracefully...');
      if (nestApp) {
        await nestApp.close();
      }
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
