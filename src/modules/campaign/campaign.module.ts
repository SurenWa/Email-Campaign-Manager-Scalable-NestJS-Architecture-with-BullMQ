import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CampaignOwnerGuard } from './guards/campaign-owner.guard';
import { EmailQueueModule } from '../email-queue/email-queue.module';

@Module({
    imports: [EmailQueueModule],
    controllers: [CampaignController],
    providers: [CampaignService, CampaignOwnerGuard],
    exports: [CampaignService],
})
export class CampaignModule {}
