import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../common/prisma';
import { CampaignStatus, EmailStatus } from '@prisma/client';
import { EMAIL_QUEUE } from '../email-queue.service';
import type { EmailJobData } from '../interfaces';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
    private readonly logger = new Logger(EmailProcessor.name);

    constructor(private prisma: PrismaService) {
        super();
    }

    async process(job: Job<EmailJobData>): Promise<void> {
        const { emailLogId, recipient, subject, campaignId, attempt } = job.data;

        this.logger.log(`Sending email to ${recipient} (attempt ${attempt}, job ${job.id})`);

        try {
            // Simulate email sending
            // In production, replace this with actual email service (SendGrid, SES, etc.)
            await this.simulateEmailSend(recipient, subject);

            // Update email log status to SENT
            await this.prisma.emailLog.update({
                where: { id: emailLogId },
                data: {
                    status: EmailStatus.SENT,
                    sentAt: new Date(),
                    attempts: attempt,
                },
            });

            this.logger.log(`Email sent successfully to ${recipient}`);

            // Check if all emails for this campaign are processed
            await this.checkCampaignCompletion(campaignId);
        } catch (error) {
            this.logger.error(`Failed to send email to ${recipient}: ${error}`);

            // Update attempt count
            await this.prisma.emailLog.update({
                where: { id: emailLogId },
                data: {
                    attempts: attempt,
                    error: error instanceof Error ? error.message : String(error),
                },
            });

            throw error; // Re-throw to trigger retry
        }
    }

    /**
     * Simulate email sending (replace with real email service in production)
     */
    private async simulateEmailSend(recipient: string, subject: string): Promise<void> {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

        // Simulate 10% failure rate for testing retries
        if (Math.random() < 0.1) {
            throw new Error(`Simulated email failure for ${recipient}`);
        }

        this.logger.debug(`[SIMULATED] Email sent to ${recipient}: ${subject}`);
    }

    /**
     * Check if all emails for a campaign have been processed
     */
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

        // If no pending or queued emails, campaign is complete
        if (pending === 0 && queued === 0) {
            const sent = statusCounts[EmailStatus.SENT] ?? 0;
            const failed = statusCounts[EmailStatus.FAILED] ?? 0;

            const finalStatus = failed === 0 ? CampaignStatus.SENT : CampaignStatus.SENT; // Could use PARTIAL_SENT if needed

            await this.prisma.campaign.update({
                where: { id: campaignId },
                data: {
                    status: finalStatus,
                    sentAt: new Date(),
                },
            });

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

            // If all retries exhausted, mark as failed
            if (job.attemptsMade >= (job.opts.attempts ?? 5)) {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.markEmailAsFailed(job.data.emailLogId, error.message);
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
