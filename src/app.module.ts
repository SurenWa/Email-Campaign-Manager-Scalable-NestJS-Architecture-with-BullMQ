import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './common/config/env.validation';
import appConfig from './common/config/app.config';
import { HealthModule } from './modules/health/health.module';

@Module({
    imports: [
        // Configuration - loaded first
        ConfigModule.forRoot({
            isGlobal: true, // Available everywhere without importing
            validate, // Validate env vars on startup
            load: [appConfig], // Load typed configs
        }),

        // Feature modules
        HealthModule,
    ],
})
export class AppModule {}
