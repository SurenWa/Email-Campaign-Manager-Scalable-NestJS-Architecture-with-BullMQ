import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface HealthIndicatorResult {
    [key: string]: {
        status: 'up' | 'down';
        message?: string;
    };
}

@Injectable()
export class RedisHealthIndicator {
    private redis: Redis;

    constructor(private configService: ConfigService) {
        this.redis = new Redis({
            host: this.configService.get<string>('REDIS_HOST') ?? 'localhost',
            port: this.configService.get<number>('REDIS_PORT') ?? 6379,
            password: configService.get<string>('REDIS_PASSWORD'),
            maxRetriesPerRequest: 1,
            lazyConnect: true,
        });
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        try {
            await this.redis.ping();
            return {
                [key]: {
                    status: 'up',
                },
            };
        } catch (error) {
            return {
                [key]: {
                    status: 'down',
                    message: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }
}
