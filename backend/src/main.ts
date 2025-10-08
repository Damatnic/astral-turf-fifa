import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  const port = configService.get('PORT') || 3333;
  
  // eslint-disable-next-line no-console
  console.log(`🔍 Attempting to listen on port ${port}...`);
  
  const server = await app.listen(port, '0.0.0.0');
  
  // eslint-disable-next-line no-console
  console.log(`✅ Listen call completed`);
  // eslint-disable-next-line no-console
  console.log(`📍 Server address:`, server.address());

  // eslint-disable-next-line no-console
  console.log(`🚀 Astral Turf Backend API running on: http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`📝 Environment: ${configService.get('NODE_ENV')}`);
  // eslint-disable-next-line no-console
  console.log(`🔗 API Prefix: /${configService.get('API_PREFIX')}`);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
