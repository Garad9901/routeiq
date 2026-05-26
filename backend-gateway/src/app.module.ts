import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { RoadsModule } from './roads/roads.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { AlertsModule } from './alerts/alerts.module';
import { DatabaseModule } from './database/database.module';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './auth/rate-limit.guard';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    // Global Configs
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),

    // PostgreSQL TypeORM setup
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://routeiq_user:routeiq_password@localhost:5432/routeiq_db',
      autoLoadEntities: true,
      synchronize: true, // Only for development/demo ease, disable in prod
    }),

    // MongoDB Mongoose setup
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/routeiq',
    ),

    // Sub-Modules
    DatabaseModule,
    AuthModule,
    RoadsModule,
    ComplaintsModule,
    MaintenanceModule,
    AlertsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
