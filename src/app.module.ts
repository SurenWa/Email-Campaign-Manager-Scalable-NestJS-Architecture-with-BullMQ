import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { validate } from './common/config/env.validation';
import appConfig from './common/config/app.config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

@Module({
    imports: [
        // Configuration - loaded first
        ConfigModule.forRoot({
            isGlobal: true,
            validate,
            load: [appConfig],
        }),

        // Feature modules
        HealthModule,
        AuthModule,
    ],
    providers: [
        // Global JWT Auth Guard - all routes require auth by default
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        // Global Roles Guard - checks roles after auth
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
})
export class AppModule {}
