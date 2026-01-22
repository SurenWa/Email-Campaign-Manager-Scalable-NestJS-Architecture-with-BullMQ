import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { validate } from './common/config/env.validation';
import appConfig from './common/config/app.config';
import jwtConfig from './common/config/jwt.config';
import redisConfig from './common/config/redis.config';
import { PrismaModule } from './common/prisma';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { EmailQueueModule } from './modules/email-queue/email-queue.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            validate,
            load: [appConfig, jwtConfig, redisConfig],
        }),

        // Database
        PrismaModule,

        // Feature modules (API only - no processors)
        HealthModule,
        AuthModule,
        CampaignModule,
        EmailQueueModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
})
export class AppModule {}
