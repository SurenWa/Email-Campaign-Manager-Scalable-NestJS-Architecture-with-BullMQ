import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsArray,
    IsEmail,
    MinLength,
    MaxLength,
    ArrayMinSize,
    ArrayMaxSize,
    IsOptional,
} from 'class-validator';

export class CreateCampaignDto {
    @ApiProperty({
        example: 'Welcome Campaign',
        description: 'Campaign name for internal reference',
    })
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    name!: string;

    @ApiProperty({
        example: 'Welcome to our platform!',
        description: 'Email subject line',
    })
    @IsString()
    @MinLength(3)
    @MaxLength(200)
    subject!: string;

    @ApiProperty({
        example: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
        description: 'Email content (HTML supported)',
    })
    @IsString()
    @MinLength(10)
    content!: string;

    @ApiPropertyOptional({
        example: ['user1@example.com', 'user2@example.com'],
        description: 'List of recipient email addresses',
    })
    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(1000)
    @IsEmail({}, { each: true, message: 'Each recipient must be a valid email' })
    recipients?: string[];
}
