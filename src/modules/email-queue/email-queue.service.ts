import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma';
import { CampaignStatus } from '@prisma/client';
import type { CampaignJobData } from './interfaces';

export const CAMPAIGN_QUEUE = 'campaign-queue';
export const EMAIL_QUEUE = 'email-queue';

@Injectable()
export class EmailQueueService {
    private readonly logger = new Logger(EmailQueueService.name);

    constructor(
        @InjectQueue(CAMPAIGN_QUEUE) private campaignQueue: Queue,
        @InjectQueue(EMAIL_QUEUE) private emailQueue: Queue,
        private prisma: PrismaService,
    ) {}

    /**
     * Add a campaign to the processing queue
     */
    async queueCampaign(campaignId: string, userId: string): Promise<void> {
        const jobData: CampaignJobData = { campaignId, userId };

        await this.campaignQueue.add('process-campaign', jobData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000, // Start with 5 seconds
            },
            removeOnComplete: 100, // Keep last 100 completed jobs
            removeOnFail: 500, // Keep last 500 failed jobs
        });

        this.logger.log(`Campaign ${campaignId} added to queue`);
    }

    /**
     * Process scheduled campaigns that are due
     */
    async processScheduledCampaigns(): Promise<void> {
        const now = new Date();

        const dueCampaigns = await this.prisma.campaign.findMany({
            where: {
                status: CampaignStatus.SCHEDULED,
                scheduledAt: {
                    lte: now,
                },
            },
        });

        this.logger.log(`Found ${dueCampaigns.length} campaigns due for sending`);

        for (const campaign of dueCampaigns) {
            await this.queueCampaign(campaign.id, campaign.userId);

            // Update status to SENDING
            await this.prisma.campaign.update({
                where: { id: campaign.id },
                data: { status: CampaignStatus.SENDING },
            });
        }
    }

    /**
     * Get queue statistics
     */
    async getQueueStats() {
        const [campaignCounts, emailCounts] = await Promise.all([
            this.campaignQueue.getJobCounts(),
            this.emailQueue.getJobCounts(),
        ]);

        return {
            campaignQueue: campaignCounts,
            emailQueue: emailCounts,
        };
    }

    /**
     * Manually trigger a campaign to send immediately
     */
    async sendCampaignNow(campaignId: string, userId: string): Promise<void> {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
        });

        if (!campaign) {
            throw new Error('Campaign not found');
        }

        if (
            campaign.status !== CampaignStatus.DRAFT &&
            campaign.status !== CampaignStatus.SCHEDULED
        ) {
            throw new Error(`Cannot send campaign with status: ${campaign.status}`);
        }

        if (!campaign.recipients || campaign.recipients.length === 0) {
            throw new Error('Campaign has no recipients');
        }

        // Update status to SENDING
        await this.prisma.campaign.update({
            where: { id: campaignId },
            data: { status: CampaignStatus.SENDING },
        });

        // Add to queue
        await this.queueCampaign(campaignId, userId);
    }

    /**
     * Pause all queues
     */
    async pauseQueues(): Promise<void> {
        await Promise.all([this.campaignQueue.pause(), this.emailQueue.pause()]);
        this.logger.warn('All queues paused');
    }

    /**
     * Resume all queues
     */
    async resumeQueues(): Promise<void> {
        await Promise.all([this.campaignQueue.resume(), this.emailQueue.resume()]);
        this.logger.log('All queues resumed');
    }
}
