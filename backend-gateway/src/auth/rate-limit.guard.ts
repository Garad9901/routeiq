import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../database/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    
    // Limits: Max 120 requests per minute
    const limit = 120;
    const windowSeconds = 60;

    const isLimited = await this.redisService.isRateLimited(ip, limit, windowSeconds);
    if (isLimited) {
      throw new HttpException(
        'Too Many Requests - Rate limit exceeded. Try again in a minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    return true;
  }
}
