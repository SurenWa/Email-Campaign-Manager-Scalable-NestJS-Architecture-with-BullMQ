import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { validate } from './common/config/env.validation';
import appConfig from './common/config/app.config';
import jwtConfig from './common/config/jwt.config';
import redisConfig from './common/config/redis.config';
import { PrismaModule } from './common/prisma';
import { ServicesModule } from './common/services';
import { MetricsModule } from './common/metrics';
import { MetricsInterceptor } from './common/interceptors';
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

        // Global Services
        ServicesModule,

        // Metrics
        MetricsModule,

        // Feature modules
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
        {
            provide: APP_INTERCEPTOR,
            useClass: MetricsInterceptor,
        },
    ],
})
export class AppModule {}
