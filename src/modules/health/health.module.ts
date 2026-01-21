import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma-health.indicator';

@Module({
    controllers: [HealthController],
    providers: [PrismaHealthIndicator],
})
export class HealthModule {}
