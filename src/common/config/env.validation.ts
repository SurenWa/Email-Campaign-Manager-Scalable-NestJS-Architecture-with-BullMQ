import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync, ValidationError } from 'class-validator';

enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}

class EnvironmentVariables {
    @IsEnum(Environment)
    NODE_ENV!: Environment;

    @IsNumber()
    PORT!: number;

    @IsString()
    API_PREFIX!: string;

    @IsString()
    DATABASE_URL!: string;

    @IsString()
    REDIS_HOST!: string;

    @IsNumber()
    REDIS_PORT!: number;

    @IsString()
    JWT_SECRET!: string;

    @IsString()
    JWT_EXPIRATION!: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });

    const errors: ValidationError[] = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        const errorMessages = errors
            .map((err) => {
                const constraints = err.constraints;
                return constraints ? Object.values(constraints).join(', ') : '';
            })
            .filter(Boolean)
            .join('; ');

        throw new Error(`Environment validation failed: ${errorMessages}`);
    }

    return validatedConfig;
}
