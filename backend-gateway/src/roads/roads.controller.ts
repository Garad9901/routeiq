import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { RoadsService } from './roads.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/rbac.guard';
import { UserRole } from '../auth/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('v1/roads')
@Controller('roads')
export class RoadsController {
  constructor(private readonly roadsService: RoadsService) {}

  @Get()
  @ApiOperation({ summary: 'List all managed roads catalogs' })
  @ApiResponse({ status: 200, description: 'Road catalog returned' })
  async getAllRoads() {
    return this.roadsService.getAllRoads();
  }

  @Get('geojson')
  @ApiOperation({ summary: 'Retrieve PostGIS segments transformed as spatial GeoJSON layers' })
  @ApiResponse({ status: 200, description: 'GeoJSON payload returned' })
  async getGeoJsonSegments() {
    return this.roadsService.getGeoJsonSegments();
  }

  @Get('kpi')
  @ApiOperation({ summary: 'Calculate overall municipal road health KPIs' })
  @ApiResponse({ status: 200, description: 'KPI metrics object' })
  async getExecutiveKPIs() {
    return this.roadsService.getExecutiveKPIs();
  }

  @Post(':id/analyze')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ENGINEER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Triggers the Python FastAPI AI scoring/forecasting pipeline for segment' })
  @ApiResponse({ status: 200, description: 'AI computation completed' })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async analyzeRoadSegment(@Param('id') id: string) {
    return this.roadsService.runAIPredictionPipeline(id);
  }

  @Get(':id/predictions')
  @ApiOperation({ summary: 'Fetch all forecasted risk timelines for a segment' })
  @ApiResponse({ status: 200, description: 'List of predictions' })
  async getSegmentPredictions(@Param('id') id: string) {
    return this.roadsService.getSegmentPredictions(id);
  }
}
