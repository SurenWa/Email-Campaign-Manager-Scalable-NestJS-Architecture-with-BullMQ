/* eslint-disable @typescript-eslint/no-misused-promises */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker.module';

async function bootstrap() {
    const logger = new Logger('Worker');

    const app = await NestFactory.createApplicationContext(WorkerModule);

    logger.log('🔧 Worker process started');
    logger.log('📥 Listening for queue jobs...');

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
        logger.log('SIGTERM received, shutting down gracefully...');
        await app.close();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        logger.log('SIGINT received, shutting down gracefully...');
        await app.close();
        process.exit(0);
    });
}

bootstrap().catch((error) => {
    console.error('Worker failed to start:', error);
    process.exit(1);
});
