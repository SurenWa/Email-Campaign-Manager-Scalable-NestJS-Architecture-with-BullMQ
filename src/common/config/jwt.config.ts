import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRATION ?? '86400';

    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }

    return {
        secret,
        expiresIn: parseInt(expiresIn, 10) || 86400,
    };
});
