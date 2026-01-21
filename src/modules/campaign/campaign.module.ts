import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CampaignOwnerGuard } from './guards/campaign-owner.guard';

@Module({
    controllers: [CampaignController],
    providers: [CampaignService, CampaignOwnerGuard],
    exports: [CampaignService],
})
export class CampaignModule {}
