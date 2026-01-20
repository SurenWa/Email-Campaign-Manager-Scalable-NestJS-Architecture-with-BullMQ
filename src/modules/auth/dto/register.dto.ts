/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        example: 'john@example.com',
        description: 'User email address',
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email!: string;

    @ApiProperty({
        example: 'John Doe',
        description: 'User full name',
    })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name!: string;

    @ApiProperty({
        example: 'SecurePass123!',
        description:
            'Password (min 8 chars, must contain uppercase, lowercase, number)',
    })
    @IsString()
    @MinLength(8)
    @MaxLength(72) // bcrypt max length
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message:
            'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    })
    password!: string;
}
