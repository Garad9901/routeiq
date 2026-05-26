import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;

    this.client = new Redis({
      host,
      port,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log(`Successfully connected to Redis cache server at ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err}`);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async setSession(userId: string, token: string, expirySeconds: number): Promise<void> {
    await this.client.set(`session:${userId}`, token, 'EX', expirySeconds);
  }

  async getSession(userId: string): Promise<string | null> {
    return this.client.get(`session:${userId}`);
  }

  async deleteSession(userId: string): Promise<void> {
    await this.client.del(`session:${userId}`);
  }

  async isRateLimited(ip: string, limit: number, windowSeconds: number): Promise<boolean> {
    const key = `rate:${ip}`;
    const requests = await this.client.incr(key);
    
    if (requests === 1) {
      await this.client.expire(key, windowSeconds);
    }
    
    return requests > limit;
  }
}
