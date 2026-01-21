import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class ScheduleCampaignDto {
    @ApiProperty({
        example: '2025-01-25T10:00:00.000Z',
        description: 'Scheduled date and time (ISO 8601 format)',
    })
    @IsNotEmpty()
    @IsDateString()
    scheduledAt!: string;
}
