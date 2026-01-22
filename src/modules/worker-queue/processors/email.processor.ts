import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../common/prisma';
import { EmailService } from '../../../common/services';
import { MetricsService } from '../../../common/metrics';
import { CampaignStatus, EmailStatus } from '@prisma/client';
import { EMAIL_QUEUE } from '../../email-queue/email-queue.service';
import type { EmailJobData } from '../../email-queue/interfaces';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
    private readonly logger = new Logger(EmailProcessor.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private metricsService: MetricsService,
    ) {
        super();
    }

    async process(job: Job<EmailJobData>): Promise<void> {
        const { emailLogId, recipient, subject, content, campaignId, attempt } = job.data;
        const startTime = Date.now();

        this.logger.log(`Sending email to ${recipient} (attempt ${attempt}, job ${job.id})`);

        try {
            const result = await this.emailService.sendEmail({
                to: recipient,
                subject,
                html: content,
            });

            const duration = (Date.now() - startTime) / 1000;

            if (!result.success) {
                throw new Error(result.error ?? 'Email sending failed');
            }

            // Update email log status to SENT
            await this.prisma.emailLog.update({
                where: { id: emailLogId },
                data: {
                    status: EmailStatus.SENT,
                    sentAt: new Date(),
                    attempts: attempt,
                    error: null,
                },
            });

            // Record metrics
            this.metricsService.emailsSentTotal.labels(campaignId).inc();
            this.metricsService.emailSendDuration.labels('success').observe(duration);
            this.metricsService.queueJobsCompleted.labels(EMAIL_QUEUE).inc();

            this.logger.log(
                `Email sent successfully to ${recipient} (messageId: ${result.messageId})`,
            );

            await this.checkCampaignCompletion(campaignId);
        } catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            const errorMessage = error instanceof Error ? error.message : String(error);

            this.logger.error(`Failed to send email to ${recipient}: ${errorMessage}`);

            // Record failure metrics
            this.metricsService.emailsFailedTotal.labels(campaignId, 'send_error').inc();
            this.metricsService.emailSendDuration.labels('failure').observe(duration);

            await this.prisma.emailLog.update({
                where: { id: emailLogId },
                data: {
                    attempts: attempt,
                    error: errorMessage,
                },
            });

            throw error;
        }
    }

    private async checkCampaignCompletion(campaignId: string): Promise<void> {
        const stats = await this.prisma.emailLog.groupBy({
            by: ['status'],
            where: { campaignId },
            _count: { status: true },
        });

        const statusCounts = stats.reduce(
            (acc, item) => {
                acc[item.status] = item._count.status;
                return acc;
            },
            {} as Record<string, number>,
        );

        const pending = statusCounts[EmailStatus.PENDING] ?? 0;
        const queued = statusCounts[EmailStatus.QUEUED] ?? 0;

        if (pending === 0 && queued === 0) {
            const sent = statusCounts[EmailStatus.SENT] ?? 0;
            const failed = statusCounts[EmailStatus.FAILED] ?? 0;

            await this.prisma.campaign.update({
                where: { id: campaignId },
                data: {
                    status: CampaignStatus.SENT,
                    sentAt: new Date(),
                },
            });

            // Record campaign sent metric
            this.metricsService.campaignsSentTotal.inc();

            this.logger.log(`Campaign ${campaignId} completed: ${sent} sent, ${failed} failed`);
        }
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job<EmailJobData>) {
        this.logger.debug(`Email job ${job.id} completed: ${job.data.recipient}`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job<EmailJobData> | undefined, error: Error) {
        if (job) {
            this.logger.error(
                `Email job ${job.id} failed for ${job.data.recipient}: ${error.message}`,
            );

            this.metricsService.queueJobsFailed.labels(EMAIL_QUEUE).inc();

            if (job.attemptsMade >= (job.opts.attempts ?? 5)) {
                void this.markEmailAsFailed(job.data.emailLogId, error.message);
            }
        }
    }

    private async markEmailAsFailed(emailLogId: string, errorMessage: string): Promise<void> {
        await this.prisma.emailLog.update({
            where: { id: emailLogId },
            data: {
                status: EmailStatus.FAILED,
                error: errorMessage,
            },
        });
    }
}
