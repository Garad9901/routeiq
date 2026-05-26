import { Injectable, Logger } from '@nestjs/common';
import { AlertsGateway } from './alerts.gateway';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly alertsGateway: AlertsGateway) {}

  emitCriticalAlert(payload: any) {
    this.logger.log(`Forwarding critical alert payload: ${payload.title || 'Untitled'}`);
    this.alertsGateway.emitAlert(payload);
  }
}
