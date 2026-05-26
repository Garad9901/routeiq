import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { RoadSegment } from '../roads/segment.entity';

@Entity('maintenance_history')
export class MaintenanceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RoadSegment, { onDelete: 'CASCADE' })
  segment: RoadSegment;

  @Column()
  repairType: string; // e.g. Patching, Resurfacing, Reconstruction, SealCoating

  @Column({ type: 'float' })
  cost: number;

  @Column({ nullable: true })
  agency: string; // Responsible municipal team/contractor

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  repairedAt: Date;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
