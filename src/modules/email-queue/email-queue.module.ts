import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { EmailQueueService, CAMPAIGN_QUEUE, EMAIL_QUEUE } from './email-queue.service';

@Module({
    imports: [
        // Register Campaign Queue (for adding jobs only)
        BullModule.registerQueueAsync({
            name: CAMPAIGN_QUEUE,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_HOST') ?? 'localhost',
                    port: configService.get<number>('REDIS_PORT') ?? 6379,
                    password: configService.get<string>('REDIS_PASSWORD'),
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
        // Register Email Queue (for stats only in API)
        BullModule.registerQueueAsync({
            name: EMAIL_QUEUE,
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_HOST') ?? 'localhost',
                    port: configService.get<number>('REDIS_PORT') ?? 6379,
                    password: configService.get<string>('REDIS_PASSWORD'),
                },
            }),
        }),
    ],
    providers: [EmailQueueService],
    exports: [EmailQueueService],
})
export class EmailQueueModule {}
