import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/rbac.guard';
import { UserRole } from '../auth/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

class CreateComplaintDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}

@ApiTags('v1/complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @ApiOperation({ summary: 'Ingest a citizen grievance complaint ticket' })
  @ApiResponse({ status: 201, description: 'Grievance ticket created' })
  async createComplaint(@Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Fetch all citizen complaints' })
  @ApiResponse({ status: 200, description: 'Grievance tickets feed returned' })
  async getComplaints() {
    return this.complaintsService.findAll();
  }

  @Get('kpi')
  @ApiOperation({ summary: 'Aggregate complaints diagnostics status values' })
  @ApiResponse({ status: 200, description: 'Diagnostics counters' })
  async getComplaintKPIs() {
    return this.complaintsService.getComplaintKPIs();
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Query complaints within proximity' })
  @ApiResponse({ status: 200, description: 'List of proximity complaints' })
  async getNearbyComplaints(
    @Query('lng') lng: string,
    @Query('lat') lat: string,
    @Query('distance') distance?: string,
  ) {
    const lon = parseFloat(lng);
    const ltd = parseFloat(lat);
    const dist = distance ? parseInt(distance, 10) : 5000;
    return this.complaintsService.findNearby(lon, ltd, dist);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket resolution status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateComplaintStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.complaintsService.updateStatus(id, dto.status);
  }
}
