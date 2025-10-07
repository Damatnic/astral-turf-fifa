import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from './redis.service';
import { SessionService } from './session.service';
import { Session } from '../users/entities/session.entity';

@Global() // Make Redis service available globally
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Session])],
  providers: [RedisService, SessionService],
  exports: [RedisService, SessionService],
})
export class RedisModule {}
