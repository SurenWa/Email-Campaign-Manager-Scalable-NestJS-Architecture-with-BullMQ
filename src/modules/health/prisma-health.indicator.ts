import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';

interface HealthIndicatorResult {
    [key: string]: {
        status: 'up' | 'down';
        message?: string;
    };
}

@Injectable()
export class PrismaHealthIndicator {
    constructor(private prisma: PrismaService) {}

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
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
