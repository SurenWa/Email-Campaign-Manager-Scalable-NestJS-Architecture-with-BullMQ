import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '../../modules/auth/decorators/public.decorator';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) {}

    @Public()
    @Get()
    @Header('Content-Type', 'text/plain')
    @ApiOperation({ summary: 'Prometheus metrics endpoint' })
    @ApiExcludeEndpoint()
    async getMetrics(): Promise<string> {
        return this.metricsService.getMetrics();
    }
}
