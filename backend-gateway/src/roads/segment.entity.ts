import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { Road } from './road.entity';
import { RiskPrediction } from './prediction.entity';

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

@Entity('road_segments')
export class RoadSegment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Road, (road) => road.segments, { onDelete: 'CASCADE' })
  road: Road;

  // PostGIS LineString geometry column
  @Column({
    type: 'geometry',
    spatialFeatureType: 'LineString',
    srid: 4326,
    nullable: true,
  })
  @Index({ spatial: true })
  geom: string; // WKT (Well-Known Text) representation or GeoJSON geometry string

  @Column({ type: 'float', default: 100.0 })
  currentHealthScore: number;

  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.LOW,
  })
  riskLevel: RiskLevel;

  @Column({ type: 'float', default: 0.0 })
  lengthMeters: number;

  @Column({ type: 'float', default: 1500.0 })
  trafficDensity: number; // daily traffic

  @Column({ type: 'timestamp', nullable: true })
  lastInspectedAt: Date;

  @OneToMany(() => RiskPrediction, (prediction) => prediction.segment)
  predictions: RiskPrediction[];
}
