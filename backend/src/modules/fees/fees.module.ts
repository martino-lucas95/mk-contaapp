import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Honorario } from './honorario.entity';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Honorario])],
  providers: [FeesService],
  controllers: [FeesController],
  exports: [FeesService],
})
export class FeesModule {}
