import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Road } from './road.entity';
import { RoadSegment, RiskLevel } from './segment.entity';
import { RiskPrediction } from './prediction.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RoadsService {
  private readonly logger = new Logger(RoadsService.name);
  private aiServiceUrl: string;

  constructor(
    @InjectRepository(Road)
    private roadRepository: Repository<Road>,
    @InjectRepository(RoadSegment)
    private segmentRepository: Repository<RoadSegment>,
    @InjectRepository(RiskPrediction)
    private predictionRepository: Repository<RiskPrediction>,
    private configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
  }

  async getAllRoads(): Promise<Road[]> {
    return this.roadRepository.find({ relations: ['segments'] });
  }

  async getGeoJsonSegments(): Promise<any> {
    const rawSegments = await this.segmentRepository
      .createQueryBuilder('seg')
      .leftJoinAndSelect('seg.road', 'road')
      .select([
        'seg.id AS id',
        'road.name AS road_name',
        'road.highwayType AS road_type',
        'seg.currentHealthScore AS health',
        'seg.riskLevel AS risk',
        'seg.lengthMeters AS length',
        'seg.trafficDensity AS traffic',
        'ST_AsGeoJSON(seg.geom) AS geometry',
      ])
      .getRawMany();

    const features = rawSegments.map((row) => ({
      type: 'Feature',
      properties: {
        id: row.id,
        roadName: row.road_name,
        roadType: row.road_type,
        health: row.health,
        risk: row.risk,
        length: row.length,
        traffic: row.traffic,
      },
      geometry: row.geometry ? JSON.parse(row.geometry) : null,
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  async getExecutiveKPIs(): Promise<any> {
    const segments = await this.segmentRepository.find();
    const count = segments.length;
    
    if (count === 0) {
      return {
        overallHealthIndex: 100,
        totalKm: 0,
        highRiskKm: 0,
        riskDistribution: { Low: 0, Medium: 0, High: 0, Critical: 0 },
      };
    }

    const totalHealth = segments.reduce((sum, s) => sum + s.currentHealthScore, 0);
    const overallHealthIndex = Math.round(totalHealth / count);
    
    const totalKm = segments.reduce((sum, s) => sum + s.lengthMeters, 0) / 1000.0;
    
    const highRiskSegments = segments.filter(
      (s) => s.riskLevel === RiskLevel.HIGH || s.riskLevel === RiskLevel.CRITICAL,
    );
    const highRiskKm = highRiskSegments.reduce((sum, s) => sum + s.lengthMeters, 0) / 1000.0;

    const riskDistribution = {
      Low: segments.filter((s) => s.riskLevel === RiskLevel.LOW).length,
      Medium: segments.filter((s) => s.riskLevel === RiskLevel.MEDIUM).length,
      High: segments.filter((s) => s.riskLevel === RiskLevel.HIGH).length,
      Critical: segments.filter((s) => s.riskLevel === RiskLevel.CRITICAL).length,
    };

    return {
      overallHealthIndex,
      totalKm: parseFloat(totalKm.toFixed(1)),
      highRiskKm: parseFloat(highRiskKm.toFixed(1)),
      riskDistribution,
    };
  }

  async runAIPredictionPipeline(segmentId: string): Promise<any> {
    const segment = await this.segmentRepository.findOne({
      where: { id: segmentId },
      relations: ['road'],
    });

    if (!segment) {
      throw new HttpException('Segment not found', HttpStatus.NOT_FOUND);
    }

    try {
      // 1. Fetch predicted road health score from FastAPI (Aligned with /v1/ API prefix)
      const scoreResponse = await fetch(`${this.aiServiceUrl}/v1/health/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traffic_density: segment.trafficDensity,
          weather_impact: 4.2,
          complaint_density: 0.8,
          maintenance_frequency: 1.5,
          satellite_crack_score: 0.18,
        }),
      });

      if (!scoreResponse.ok) {
        throw new Error('AI health scoring endpoint failed');
      }
      const scoreResult = await scoreResponse.json();

      // 2. Fetch 90-day degradation forecast timeline (Aligned with /v1/ API prefix)
      const forecastResponse = await fetch(`${this.aiServiceUrl}/v1/forecast/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_health: scoreResult.health_score,
          daily_traffic: segment.trafficDensity,
          precipitation_index: 4.2,
          complaints_trend: 0.8,
          days_since_maintenance: 180,
        }),
      });

      if (!forecastResponse.ok) {
        throw new Error('AI forecasting endpoint failed');
      }
      const forecastResult = await forecastResponse.json();

      // 3. Update segment health state
      segment.currentHealthScore = scoreResult.health_score;
      if (scoreResult.health_score < 40) {
        segment.riskLevel = RiskLevel.CRITICAL;
      } else if (scoreResult.health_score < 60) {
        segment.riskLevel = RiskLevel.HIGH;
      } else if (scoreResult.health_score < 75) {
        segment.riskLevel = RiskLevel.MEDIUM;
      } else {
        segment.riskLevel = RiskLevel.LOW;
      }
      segment.lastInspectedAt = new Date();
      await this.segmentRepository.save(segment);

      // 4. Save/update predictions
      await this.predictionRepository.delete({ segment: { id: segmentId } });
      
      const predictions = forecastResult.forecast_timeline.map((item: any) => {
        return this.predictionRepository.create({
          segment,
          forecastDate: new Date(item.projected_date),
          predictedHealthScore: item.projected_health,
          confidence: forecastResult.confidence_percentage,
          factors: scoreResult.explainability.shap_values,
        });
      });
      await this.predictionRepository.save(predictions);

      return {
        segmentId: segment.id,
        currentHealthScore: segment.currentHealthScore,
        riskLevel: segment.riskLevel,
        explainability: scoreResult.explainability,
        forecast: forecastResult,
      };
    } catch (err) {
      this.logger.error(`Error executing AI pipeline: ${err.message}`);
      throw new HttpException(
        `AI Pipeline connection error: ${err.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getSegmentPredictions(segmentId: string): Promise<RiskPrediction[]> {
    return this.predictionRepository.find({
      where: { segment: { id: segmentId } },
      order: { forecastDate: 'ASC' },
    });
  }
}
