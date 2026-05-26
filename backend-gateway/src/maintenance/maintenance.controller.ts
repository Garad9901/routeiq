import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/rbac.guard';
import { UserRole } from '../auth/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

class ApproveRepairDto {
  @IsString()
  @IsNotEmpty()
  segmentId: string;

  @IsString()
  @IsNotEmpty()
  repairType: string;

  @IsNumber()
  @IsNotEmpty()
  cost: number;

  @IsString()
  @IsNotEmpty()
  agency: string;
}

@ApiTags('v1/maintenance')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('history')
  @ApiOperation({ summary: 'Retrieve historical records of municipal road repairs' })
  @ApiResponse({ status: 200, description: 'List of completed repairs' })
  async getHistory() {
    return this.maintenanceService.getMaintenanceHistory();
  }

  @Get('optimize')
  @ApiOperation({ summary: 'Generate budget-aware maintenance recommendations optimized by ROI' })
  @ApiResponse({ status: 200, description: 'Optimized planning output' })
  async getOptimizePlan(@Query('budget') budget: string) {
    const maxBudget = budget ? parseFloat(budget) : 100000;
    return this.maintenanceService.generateOptimizationPlan(maxBudget);
  }

  @Post('approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ENGINEER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a deferred or recommended repair item for execution' })
  @ApiResponse({ status: 201, description: 'Repair logged and road segment state restored' })
  async approveRepair(@Body() dto: ApproveRepairDto) {
    return this.maintenanceService.approveRepair(dto.segmentId, dto.repairType, dto.cost, dto.agency);
  }
}
