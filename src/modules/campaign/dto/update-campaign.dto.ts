import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsArray,
    IsEmail,
    MinLength,
    MaxLength,
    ArrayMinSize,
    ArrayMaxSize,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { CampaignStatus } from '@prisma/client';

export class UpdateCampaignDto {
    @ApiPropertyOptional({
        example: 'Updated Campaign Name',
        description: 'Campaign name for internal reference',
    })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({
        example: 'Updated Subject Line',
        description: 'Email subject line',
    })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(200)
    subject?: string;

    @ApiPropertyOptional({
        example: '<h1>Updated Content</h1>',
        description: 'Email content (HTML supported)',
    })
    @IsOptional()
    @IsString()
    @MinLength(10)
    content?: string;

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

    @ApiPropertyOptional({
        enum: CampaignStatus,
        example: 'DRAFT',
        description: 'Campaign status',
    })
    @IsOptional()
    @IsEnum(CampaignStatus)
    status?: CampaignStatus;
}
