import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET');
                const expiresIn =
                    configService.get<string>('JWT_EXPIRATION') ?? '1d';

                if (!secret) {
                    throw new Error(
                        'JWT_SECRET environment variable is not defined',
                    );
                }

                return {
                    secret,
                    signOptions: {
                        expiresIn: expiresIn as
                            | `${number}${'s' | 'm' | 'h' | 'd'}`
                            | number,
                    },
                };
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule {}
