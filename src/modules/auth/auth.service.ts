/* eslint-disable @typescript-eslint/require-await */
import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto';
import { Role } from './enums/role.enum';
import { JwtPayload } from './strategies/jwt.strategy';

// Temporary in-memory user storage (will be replaced with Prisma in Phase 3)
interface User {
    id: string;
    email: string;
    name: string;
    password: string;
    role: Role;
    createdAt: Date;
}

@Injectable()
export class AuthService {
    // Temporary storage - will be replaced with database in Phase 3
    private users: User[] = [];
    private readonly SALT_ROUNDS = 10;

    constructor(private jwtService: JwtService) {}

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        const { email, name, password } = registerDto;

        // Check if user already exists
        const existingUser = this.users.find((u) => u.email === email);
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

        // Create user
        const user: User = {
            id: this.generateId(),
            email,
            name,
            password: hashedPassword,
            role: Role.USER,
            createdAt: new Date(),
        };

        this.users.push(user);

        // Generate JWT
        const tokens = await this.generateTokens(user);

        return {
            accessToken: tokens.accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const { email, password } = loginDto;

        // Find user
        const user = this.users.find((u) => u.email === email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT
        const tokens = await this.generateTokens(user);

        return {
            accessToken: tokens.accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    async validateUser(payload: JwtPayload): Promise<User | null> {
        const user = this.users.find((u) => u.id === payload.sub);
        return user ?? null;
    }

    getProfile(userId: string): Omit<User, 'password'> | null {
        const user = this.users.find((u) => u.id === userId);
        if (!user) {
            return null;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    private async generateTokens(user: User): Promise<{ accessToken: string }> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        return { accessToken };
    }

    private generateId(): string {
        return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}
