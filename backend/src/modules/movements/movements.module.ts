import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movimiento } from './movimiento.entity';
import { MovementsService } from './movements.service';
import { MovementsController } from './movements.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Movimiento])],
  providers: [MovementsService],
  controllers: [MovementsController],
  exports: [MovementsService],
})
export class MovementsModule {}
