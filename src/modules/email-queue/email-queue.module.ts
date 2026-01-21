import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { EmailQueueService, CAMPAIGN_QUEUE, EMAIL_QUEUE } from './email-queue.service';
import { CampaignProcessor } from './processors/campaign.processor';
import { EmailProcessor } from './processors/email.processor';

@Module({
    imports: [
        // Register Campaign Queue
        BullModule.registerQueueAsync({
            name: CAMPAIGN_QUEUE,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_HOST') ?? 'localhost',
                    port: configService.get<number>('REDIS_PORT') ?? 6379,
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                },
            }),
        }),
        // Register Email Queue
        BullModule.registerQueueAsync({
            name: EMAIL_QUEUE,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_HOST') ?? 'localhost',
                    port: configService.get<number>('REDIS_PORT') ?? 6379,
                },
                defaultJobOptions: {
                    attempts: 5,
                    backoff: {
                        type: 'exponential',
                        delay: 3000,
                    },
                },
            }),
        }),
    ],
    providers: [EmailQueueService, CampaignProcessor, EmailProcessor],
    exports: [EmailQueueService],
})
export class EmailQueueModule {}
