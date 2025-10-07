import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { FamilyPermission } from './entities/family-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Session, FamilyPermission])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
