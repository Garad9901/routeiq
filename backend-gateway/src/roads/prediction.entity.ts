import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { RoadSegment } from './segment.entity';

@Entity('risk_predictions')
export class RiskPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RoadSegment, (segment) => segment.predictions, { onDelete: 'CASCADE' })
  segment: RoadSegment;

  @Column({ type: 'date' })
  forecastDate: Date;

  @Column({ type: 'float' })
  predictedHealthScore: number;

  @Column({ type: 'float', default: 85.0 })
  confidence: number;

  @Column({ type: 'jsonb', nullable: true })
  factors: Record<string, any>; // SHAP values breakdown

  @CreateDateColumn()
  createdAt: Date;
}
