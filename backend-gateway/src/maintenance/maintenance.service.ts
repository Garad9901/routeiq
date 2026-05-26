import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceHistory } from './maintenance.entity';
import { RoadSegment, RiskLevel } from '../roads/segment.entity';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    @InjectRepository(MaintenanceHistory)
    private historyRepository: Repository<MaintenanceHistory>,
    @InjectRepository(RoadSegment)
    private segmentRepository: Repository<RoadSegment>,
  ) {}

  async getMaintenanceHistory(): Promise<MaintenanceHistory[]> {
    return this.historyRepository.find({
      relations: ['segment', 'segment.road'],
      order: { repairedAt: 'DESC' },
    });
  }

  async generateOptimizationPlan(maxBudget: number): Promise<any> {
    // Find all degraded segments needing maintenance (health < 75)
    const segments = await this.segmentRepository
      .createQueryBuilder('seg')
      .leftJoinAndSelect('seg.road', 'road')
      .where('seg.currentHealthScore < :limit', { limit: 75 })
      .getMany();

    const plannedRepairs = [];
    let accumulatedCost = 0;

    for (const seg of segments) {
      let repairType = 'Patching';
      let costPerMeter = 15;
      let urgencyScore = 0; // scale 1-10

      if (seg.currentHealthScore < 40) {
        repairType = 'Full Reconstruction';
        costPerMeter = 120;
        urgencyScore = 9.5;
      } else if (seg.currentHealthScore < 60) {
        repairType = 'Asphalt Resurfacing';
        costPerMeter = 45;
        urgencyScore = 7.0;
      } else {
        repairType = 'Seal Coating & Patching';
        costPerMeter = 15;
        urgencyScore = 4.5;
      }

      const totalCost = seg.lengthMeters * costPerMeter;
      
      // ROI calculation: (Health improvement gap) * length / cost
      // Since health improvements will restore health to 100, gap = (100 - health)
      const healthGap = 100 - seg.currentHealthScore;
      const roiIndex = (healthGap * seg.lengthMeters) / totalCost;

      plannedRepairs.push({
        segmentId: seg.id,
        roadName: seg.road ? seg.road.name : 'Unknown Route',
        length: seg.lengthMeters,
        health: seg.currentHealthScore,
        urgencyScore,
        repairType,
        estimatedCost: Math.round(totalCost),
        roiIndex: parseFloat(roiIndex.toFixed(2)),
      });
    }

    // Sort by Urgency score (descending) then by ROI Index (descending)
    plannedRepairs.sort((a, b) => b.urgencyScore - a.urgencyScore || b.roiIndex - a.roiIndex);

    // Apply budget constraint filtering
    const approvedList = [];
    const deferredList = [];

    for (const repair of plannedRepairs) {
      if (accumulatedCost + repair.estimatedCost <= maxBudget) {
        accumulatedCost += repair.estimatedCost;
        approvedList.push(repair);
      } else {
        deferredList.push(repair);
      }
    }

    return {
      maxBudget,
      totalCostApproved: accumulatedCost,
      remainingBudget: maxBudget - accumulatedCost,
      approvedRepairsCount: approvedList.length,
      deferredRepairsCount: deferredList.length,
      approvedPlan: approvedList,
      deferredPlan: deferredList,
    };
  }

  async approveRepair(segmentId: string, repairType: string, cost: number, agency: string): Promise<MaintenanceHistory> {
    const segment = await this.segmentRepository.findOne({ where: { id: segmentId } });
    if (!segment) {
      throw new HttpException('Segment not found', HttpStatus.NOT_FOUND);
    }

    // Create history entry
    const history = this.historyRepository.create({
      segment,
      repairType,
      cost,
      agency,
      notes: `AI-Optimized plan auto-approved for execution. restored health baseline to 95.`,
    });

    const saved = await this.historyRepository.save(history);

    // Reset segment health back to 95 after repair
    segment.currentHealthScore = 95.0;
    segment.riskLevel = RiskLevel.LOW;
    segment.lastInspectedAt = new Date();
    await this.segmentRepository.save(segment);

    this.logger.log(`Maintenance repair executed: ${repairType} on Segment ${segmentId} by ${agency}. Cost: $${cost}`);
    return saved;
  }
}
