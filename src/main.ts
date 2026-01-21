import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);

    // Get config service
    const configService = app.get(ConfigService);

    // Get config values with defaults (ensures they're never undefined)
    const port = configService.get<number>('app.port') ?? 3000;
    const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api/v1';

    // Global prefix for all routes
    app.setGlobalPrefix(apiPrefix);

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Swagger setup
    const swaggerConfig = new DocumentBuilder()
        .setTitle('Email Campaign Manager')
        .setDescription('API for managing email campaigns with background processing')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);

    // CORS for development
    app.enableCors();

    await app.listen(port);

    console.log(`
    🚀 Application is running on: http://localhost:${port}/${apiPrefix}
    📚 Swagger docs available at: http://localhost:${port}/docs
  `);
}

void bootstrap();
