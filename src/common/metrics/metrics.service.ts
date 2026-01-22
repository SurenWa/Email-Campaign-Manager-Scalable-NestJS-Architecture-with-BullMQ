import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
    private readonly registry: Registry;

    // HTTP Metrics
    public readonly httpRequestDuration: Histogram<string>;
    public readonly httpRequestTotal: Counter<string>;

    // Email Metrics
    public readonly emailsSentTotal: Counter<string>;
    public readonly emailsFailedTotal: Counter<string>;
    public readonly emailSendDuration: Histogram<string>;

    // Queue Metrics
    public readonly queueJobsTotal: Counter<string>;
    public readonly queueJobsActive: Gauge<string>;
    public readonly queueJobsWaiting: Gauge<string>;
    public readonly queueJobsCompleted: Counter<string>;
    public readonly queueJobsFailed: Counter<string>;

    // Campaign Metrics
    public readonly campaignsCreatedTotal: Counter<string>;
    public readonly campaignsSentTotal: Counter<string>;

    constructor() {
        this.registry = new Registry();

        // HTTP Request Duration
        this.httpRequestDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5],
            registers: [this.registry],
        });

        // HTTP Request Total
        this.httpRequestTotal = new Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.registry],
        });

        // Emails Sent
        this.emailsSentTotal = new Counter({
            name: 'emails_sent_total',
            help: 'Total number of emails sent successfully',
            labelNames: ['campaign_id'],
            registers: [this.registry],
        });

        // Emails Failed
        this.emailsFailedTotal = new Counter({
            name: 'emails_failed_total',
            help: 'Total number of emails that failed to send',
            labelNames: ['campaign_id', 'error_type'],
            registers: [this.registry],
        });

        // Email Send Duration
        this.emailSendDuration = new Histogram({
            name: 'email_send_duration_seconds',
            help: 'Duration of email sending in seconds',
            labelNames: ['status'],
            buckets: [0.1, 0.5, 1, 2, 5, 10],
            registers: [this.registry],
        });

        // Queue Jobs Total
        this.queueJobsTotal = new Counter({
            name: 'queue_jobs_total',
            help: 'Total number of jobs added to queue',
            labelNames: ['queue_name'],
            registers: [this.registry],
        });

        // Queue Jobs Active
        this.queueJobsActive = new Gauge({
            name: 'queue_jobs_active',
            help: 'Number of currently active jobs',
            labelNames: ['queue_name'],
            registers: [this.registry],
        });

        // Queue Jobs Waiting
        this.queueJobsWaiting = new Gauge({
            name: 'queue_jobs_waiting',
            help: 'Number of jobs waiting in queue',
            labelNames: ['queue_name'],
            registers: [this.registry],
        });

        // Queue Jobs Completed
        this.queueJobsCompleted = new Counter({
            name: 'queue_jobs_completed_total',
            help: 'Total number of completed jobs',
            labelNames: ['queue_name'],
            registers: [this.registry],
        });

        // Queue Jobs Failed
        this.queueJobsFailed = new Counter({
            name: 'queue_jobs_failed_total',
            help: 'Total number of failed jobs',
            labelNames: ['queue_name'],
            registers: [this.registry],
        });

        // Campaigns Created
        this.campaignsCreatedTotal = new Counter({
            name: 'campaigns_created_total',
            help: 'Total number of campaigns created',
            registers: [this.registry],
        });

        // Campaigns Sent
        this.campaignsSentTotal = new Counter({
            name: 'campaigns_sent_total',
            help: 'Total number of campaigns sent',
            registers: [this.registry],
        });
    }

    getRegistry(): Registry {
        return this.registry;
    }

    async getMetrics(): Promise<string> {
        return this.registry.metrics();
    }
}
