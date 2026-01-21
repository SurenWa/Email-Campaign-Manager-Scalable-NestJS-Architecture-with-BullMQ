import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma-health.indicator';
import { RedisHealthIndicator } from './redis-health.indicator';

@Module({
    controllers: [HealthController],
    providers: [PrismaHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
