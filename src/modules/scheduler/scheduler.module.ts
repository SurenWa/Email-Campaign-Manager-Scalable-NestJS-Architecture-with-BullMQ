import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';
import { CAMPAIGN_QUEUE } from '../email-queue/email-queue.service';

@Module({
    imports: [
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
    ],
    providers: [SchedulerService],
})
export class SchedulerModule {}
