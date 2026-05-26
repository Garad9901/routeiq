import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Road } from './road.entity';
import { RoadSegment } from './segment.entity';
import { RiskPrediction } from './prediction.entity';
import { RoadsService } from './roads.service';
import { RoadsController } from './roads.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Road, RoadSegment, RiskPrediction]),
    AuthModule,
  ],
  controllers: [RoadsController],
  providers: [RoadsService],
  exports: [RoadsService],
})
export class RoadsModule {}
