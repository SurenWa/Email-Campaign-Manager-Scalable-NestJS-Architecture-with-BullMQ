import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto';
import { Role } from './enums/role.enum';
import type { JwtPayload } from './strategies/jwt.strategy';
import type { User } from '@prisma/client';

@Injectable()
export class AuthService {
    private readonly SALT_ROUNDS = 10;

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        const { email, name, password } = registerDto;

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

        // Create user in database
        const user = await this.prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: Role.USER.toUpperCase() as 'USER' | 'ADMIN',
            },
        });

        // Generate JWT
        const accessToken = await this.generateToken(user);

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role.toLowerCase(),
            },
        };
    }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const { email, password } = loginDto;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT
        const accessToken = await this.generateToken(user);

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role.toLowerCase(),
            },
        };
    }

    async validateUser(payload: JwtPayload): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        return user;
    }

    async getUserById(userId: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id: userId },
        });
    }

    private async generateToken(user: User): Promise<string> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role.toLowerCase(),
        };

        return this.jwtService.signAsync(payload);
    }
}
