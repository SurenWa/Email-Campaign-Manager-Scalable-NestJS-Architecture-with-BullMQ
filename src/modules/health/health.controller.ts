import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
    HealthCheck,
    HealthCheckService,
    MemoryHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private memory: MemoryHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Check application health' })
    check() {
        return this.health.check([
            // Check memory heap (fails if > 150MB)
            () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
        ]);
    }

    @Get('ping')
    @ApiOperation({ summary: 'Simple ping endpoint' })
    ping() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
