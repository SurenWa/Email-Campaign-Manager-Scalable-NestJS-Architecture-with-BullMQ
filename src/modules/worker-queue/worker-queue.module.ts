import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { CAMPAIGN_QUEUE, EMAIL_QUEUE } from '../email-queue/email-queue.service';
import { CampaignProcessor } from './processors/campaign.processor';
import { EmailProcessor } from './processors/email.processor';

@Module({
    imports: [
        // Register Campaign Queue (for worker)
        BullModule.registerQueueAsync({
            name: CAMPAIGN_QUEUE,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_HOST') ?? 'localhost',
                    port: configService.get<number>('REDIS_PORT') ?? 6379,
                },
            }),
        }),
        // Register Email Queue (for worker)
        BullModule.registerQueueAsync({
            name: EMAIL_QUEUE,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_HOST') ?? 'localhost',
                    port: configService.get<number>('REDIS_PORT') ?? 6379,
                },
            }),
        }),
    ],
    providers: [CampaignProcessor, EmailProcessor],
})
export class WorkerQueueModule {}
