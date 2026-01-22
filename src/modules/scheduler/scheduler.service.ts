import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma';
import { CampaignStatus } from '@prisma/client';
import { CAMPAIGN_QUEUE } from '../email-queue/email-queue.service';
import type { CampaignJobData } from '../email-queue/interfaces';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private prisma: PrismaService,
        @InjectQueue(CAMPAIGN_QUEUE) private campaignQueue: Queue,
    ) {}

    /**
     * Check for scheduled campaigns every minute
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async processScheduledCampaigns(): Promise<void> {
        this.logger.debug('Checking for scheduled campaigns...');

        const now = new Date();

        const dueCampaigns = await this.prisma.campaign.findMany({
            where: {
                status: CampaignStatus.SCHEDULED,
                scheduledAt: {
                    lte: now,
                },
            },
        });

        if (dueCampaigns.length === 0) {
            return;
        }

        this.logger.log(`Found ${dueCampaigns.length} campaigns due for sending`);

        for (const campaign of dueCampaigns) {
            try {
                // Add to queue
                const jobData: CampaignJobData = {
                    campaignId: campaign.id,
                    userId: campaign.userId,
                };

                await this.campaignQueue.add('process-campaign', jobData, {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                });

                // Update status to SENDING
                await this.prisma.campaign.update({
                    where: { id: campaign.id },
                    data: { status: CampaignStatus.SENDING },
                });

                this.logger.log(`Campaign ${campaign.id} queued for sending`);
            } catch (error) {
                this.logger.error(`Failed to queue campaign ${campaign.id}: ${error}`);
            }
        }
    }

    /**
     * Clean up old completed jobs every hour
     */
    @Cron(CronExpression.EVERY_HOUR)
    async cleanupOldJobs(): Promise<void> {
        this.logger.debug('Cleaning up old jobs...');

        try {
            // Clean completed jobs older than 24 hours
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

            await this.campaignQueue.clean(oneDayAgo, 1000, 'completed');

            this.logger.log('Old jobs cleaned up successfully');
        } catch (error) {
            this.logger.error(`Failed to clean up old jobs: ${error}`);
        }
    }

    /**
     * Log queue stats every 5 minutes
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async logQueueStats(): Promise<void> {
        try {
            const counts = await this.campaignQueue.getJobCounts();
            this.logger.log(`Queue stats: ${JSON.stringify(counts)}`);
        } catch (error) {
            this.logger.error(`Failed to get queue stats: ${error}`);
        }
    }
}
