import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    HealthCheck,
    HealthCheckService,
    MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private memory: MemoryHealthIndicator,
    ) {}

    @Public()
    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Check application health' })
    check() {
        return this.health.check([
            () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
        ]);
    }

    @Public()
    @Get('ping')
    @ApiOperation({ summary: 'Simple ping endpoint' })
    ping() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
