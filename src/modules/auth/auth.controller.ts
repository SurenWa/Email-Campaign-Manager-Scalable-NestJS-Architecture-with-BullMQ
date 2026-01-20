import {
    Controller,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
    NotFoundException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

// Define response type for profile (avoids exposing internal User type)
interface ProfileResponse {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({
        status: 201,
        description: 'User registered successfully',
        type: AuthResponseDto,
    })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
        return this.authService.register(registerDto);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
        type: AuthResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(loginDto);
    }

    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile returned' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getProfile(@CurrentUser('sub') userId: string): ProfileResponse {
        const profile = this.authService.getProfile(userId);
        if (!profile) {
            throw new NotFoundException('User not found');
        }
        return profile;
    }

    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user from JWT token' })
    @ApiResponse({ status: 200, description: 'Current user info from token' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getMe(
        @CurrentUser('sub') userId: string,
        @CurrentUser('email') email: string,
        @CurrentUser('role') role: string,
    ) {
        return {
            userId,
            email,
            role,
        };
    }
}
