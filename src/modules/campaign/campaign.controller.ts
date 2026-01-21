import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto, ScheduleCampaignDto, CampaignQueryDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CampaignOwnerGuard } from './guards/campaign-owner.guard';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignController {
    constructor(private readonly campaignService: CampaignService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new campaign' })
    @ApiResponse({ status: 201, description: 'Campaign created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    async create(@CurrentUser('sub') userId: string, @Body() createCampaignDto: CreateCampaignDto) {
        return this.campaignService.create(userId, createCampaignDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all campaigns for current user' })
    @ApiResponse({ status: 200, description: 'List of campaigns' })
    async findAll(@CurrentUser('sub') userId: string, @Query() query: CampaignQueryDto) {
        return this.campaignService.findAll(userId, query);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get campaign statistics for current user' })
    @ApiResponse({ status: 200, description: 'Campaign statistics' })
    async getStats(@CurrentUser('sub') userId: string) {
        return this.campaignService.getStats(userId);
    }

    @Get(':id')
    @UseGuards(CampaignOwnerGuard)
    @ApiOperation({ summary: 'Get a single campaign by ID' })
    @ApiParam({ name: 'id', description: 'Campaign ID' })
    @ApiResponse({ status: 200, description: 'Campaign details' })
    @ApiResponse({ status: 404, description: 'Campaign not found' })
    async findOne(@Param('id') id: string) {
        return this.campaignService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(CampaignOwnerGuard)
    @ApiOperation({ summary: 'Update a campaign' })
    @ApiParam({ name: 'id', description: 'Campaign ID' })
    @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input or campaign status' })
    @ApiResponse({ status: 404, description: 'Campaign not found' })
    async update(@Param('id') id: string, @Body() updateCampaignDto: UpdateCampaignDto) {
        return this.campaignService.update(id, updateCampaignDto);
    }

    @Delete(':id')
    @UseGuards(CampaignOwnerGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete a campaign' })
    @ApiParam({ name: 'id', description: 'Campaign ID' })
    @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
    @ApiResponse({ status: 400, description: 'Cannot delete campaign' })
    @ApiResponse({ status: 404, description: 'Campaign not found' })
    async remove(@Param('id') id: string) {
        return this.campaignService.remove(id);
    }

    @Post(':id/schedule')
    @UseGuards(CampaignOwnerGuard)
    @ApiOperation({ summary: 'Schedule a campaign for sending' })
    @ApiParam({ name: 'id', description: 'Campaign ID' })
    @ApiResponse({ status: 200, description: 'Campaign scheduled successfully' })
    @ApiResponse({ status: 400, description: 'Invalid schedule or campaign status' })
    @ApiResponse({ status: 404, description: 'Campaign not found' })
    async schedule(@Param('id') id: string, @Body() scheduleCampaignDto: ScheduleCampaignDto) {
        return this.campaignService.schedule(id, scheduleCampaignDto);
    }

    @Post(':id/cancel-schedule')
    @UseGuards(CampaignOwnerGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel a scheduled campaign' })
    @ApiParam({ name: 'id', description: 'Campaign ID' })
    @ApiResponse({ status: 200, description: 'Schedule cancelled successfully' })
    @ApiResponse({ status: 400, description: 'Campaign is not scheduled' })
    @ApiResponse({ status: 404, description: 'Campaign not found' })
    async cancelSchedule(@Param('id') id: string) {
        return this.campaignService.cancelSchedule(id);
    }
}
