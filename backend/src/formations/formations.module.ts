import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormationsService } from './formations.service';
import { FormationsController } from './formations.controller';
import { Formation } from './entities/formation.entity';
import { FormationPosition } from './entities/formation-position.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Formation, FormationPosition])],
  providers: [FormationsService],
  controllers: [FormationsController],
  exports: [FormationsService],
})
export class FormationsModule {}
