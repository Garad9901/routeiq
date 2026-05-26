import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'alerts',
})
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AlertsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { status: 'authorized', clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_city_channel')
  handleJoinChannel(
    @MessageBody() data: { cityId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.cityId);
    this.logger.log(`Client ${client.id} joined channel: ${data.cityId}`);
    return { status: 'joined', channel: data.cityId };
  }

  emitAlert(payload: any) {
    if (this.server) {
      this.server.emit('critical_anomaly', payload);
      this.logger.log(`WebSocket: Emitted critical anomaly alert to all clients.`);
    } else {
      this.logger.warn('WebSocket: Server not initialized yet.');
    }
  }
}
