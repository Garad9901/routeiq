import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { RoadSegment } from './segment.entity';

@Entity('roads')
export class Road {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  highwayType: string; // e.g. primary, secondary, residential

  @Column({ nullable: true })
  osmId: string; // OpenStreetMap identifier

  @OneToMany(() => RoadSegment, (segment) => segment.road)
  segments: RoadSegment[];

  @CreateDateColumn()
  createdAt: Date;
}
