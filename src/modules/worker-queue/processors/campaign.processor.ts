import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PrismaService } from '../../../common/prisma';
import { CampaignStatus, EmailStatus } from '@prisma/client';
import { CAMPAIGN_QUEUE, EMAIL_QUEUE } from '../../email-queue/email-queue.service';
import type { CampaignJobData, EmailJobData } from '../../email-queue/interfaces';

@Processor(CAMPAIGN_QUEUE)
export class CampaignProcessor extends WorkerHost {
    private readonly logger = new Logger(CampaignProcessor.name);

    constructor(
        private prisma: PrismaService,
        @InjectQueue(EMAIL_QUEUE) private emailQueue: Queue,
    ) {
        super();
    }

    async process(job: Job<CampaignJobData>): Promise<void> {
        const { campaignId } = job.data;

        this.logger.log(`Processing campaign: ${campaignId}`);

        try {
            const campaign = await this.prisma.campaign.findUnique({
                where: { id: campaignId },
            });

            if (!campaign) {
                throw new Error(`Campaign ${campaignId} not found`);
            }

            if (!campaign.recipients || campaign.recipients.length === 0) {
                throw new Error(`Campaign ${campaignId} has no recipients`);
            }

            // Create email logs for each recipient
            const emailLogs = await Promise.all(
                campaign.recipients.map((recipient) =>
                    this.prisma.emailLog.create({
                        data: {
                            campaignId,
                            recipient,
                            status: EmailStatus.QUEUED,
                        },
                    }),
                ),
            );

            this.logger.log(`Created ${emailLogs.length} email logs for campaign ${campaignId}`);

            // Add individual email jobs to the queue
            const emailJobs = emailLogs.map((log) => ({
                name: 'send-email',
                data: {
                    campaignId,
                    emailLogId: log.id,
                    recipient: log.recipient,
                    subject: campaign.subject,
                    content: campaign.content,
                    attempt: 1,
                } as EmailJobData,
                opts: {
                    attempts: 5,
                    backoff: {
                        type: 'exponential' as const,
                        delay: 3000,
                    },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
            }));

            await this.emailQueue.addBulk(emailJobs);

            this.logger.log(
                `Added ${emailJobs.length} email jobs to queue for campaign ${campaignId}`,
            );
        } catch (error) {
            this.logger.error(`Failed to process campaign ${campaignId}: ${error}`);

            await this.prisma.campaign.update({
                where: { id: campaignId },
                data: { status: CampaignStatus.FAILED },
            });

            throw error;
        }
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job<CampaignJobData>) {
        this.logger.log(`Campaign job ${job.id} completed: ${job.data.campaignId}`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job<CampaignJobData> | undefined, error: Error) {
        this.logger.error(`Campaign job ${job?.id} failed: ${error.message}`);
    }
}
