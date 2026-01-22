/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    constructor(private readonly metricsService: MetricsService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const startTime = Date.now();

        // Get route pattern (e.g., /api/v1/campaigns/:id instead of /api/v1/campaigns/123)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const route = request.route?.path ?? request.path;
        const method = request.method;

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = (Date.now() - startTime) / 1000;
                    const statusCode = response.statusCode.toString();

                    this.metricsService.httpRequestDuration

                        .labels(method, route, statusCode)
                        .observe(duration);

                    this.metricsService.httpRequestTotal.labels(method, route, statusCode).inc();
                },
                error: () => {
                    const duration = (Date.now() - startTime) / 1000;
                    const statusCode = response.statusCode.toString();

                    this.metricsService.httpRequestDuration

                        .labels(method, route, statusCode)
                        .observe(duration);

                    this.metricsService.httpRequestTotal.labels(method, route, statusCode).inc();
                },
            }),
        );
    }
}
