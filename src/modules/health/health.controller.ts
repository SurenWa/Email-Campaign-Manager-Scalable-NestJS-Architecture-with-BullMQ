import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaHealthIndicator } from './prisma-health.indicator';

interface HealthCheckResponse {
    status: 'ok' | 'error';
    info: Record<string, { status: string; message?: string }>;
    error: Record<string, { status: string; message?: string }>;
    details: Record<string, { status: string; message?: string }>;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private prismaHealth: PrismaHealthIndicator) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'Check application health' })
    async check(): Promise<HealthCheckResponse> {
        const dbHealth = await this.prismaHealth.isHealthy('database');
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

        const memoryStatus = heapUsedMB < 150 ? 'up' : 'down';

        const info: Record<string, { status: string; message?: string }> = {};
        const error: Record<string, { status: string; message?: string }> = {};

        // Database health
        if (dbHealth['database']?.status === 'up') {
            info['database'] = { status: 'up' };
        } else {
            error['database'] = {
                status: 'down',
                message: dbHealth['database']?.message,
            };
        }

        // Memory health
        if (memoryStatus === 'up') {
            info['memory_heap'] = {
                status: 'up',
                message: `${heapUsedMB}MB / ${heapTotalMB}MB`,
            };
        } else {
            error['memory_heap'] = {
                status: 'down',
                message: `Heap usage too high: ${heapUsedMB}MB`,
            };
        }

        const hasErrors = Object.keys(error).length > 0;

        return {
            status: hasErrors ? 'error' : 'ok',
            info,
            error,
            details: { ...info, ...error },
        };
    }

    @Public()
    @Get('ping')
    @ApiOperation({ summary: 'Simple ping endpoint' })
    ping() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
