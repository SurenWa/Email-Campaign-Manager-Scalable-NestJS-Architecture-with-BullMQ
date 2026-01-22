import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validate } from './common/config/env.validation';
import appConfig from './common/config/app.config';
import jwtConfig from './common/config/jwt.config';
import redisConfig from './common/config/redis.config';
import { PrismaModule } from './common/prisma';
import { ServicesModule } from './common/services';
import { WorkerQueueModule } from './modules/worker-queue/worker-queue.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            validate,
            load: [appConfig, jwtConfig, redisConfig],
        }),

        // Scheduling for cron jobs
        ScheduleModule.forRoot(),

        // Database
        PrismaModule,

        // Global Services
        ServicesModule,

        // Worker-specific modules
        WorkerQueueModule,
        SchedulerModule,
    ],
})
export class WorkerModule {}
