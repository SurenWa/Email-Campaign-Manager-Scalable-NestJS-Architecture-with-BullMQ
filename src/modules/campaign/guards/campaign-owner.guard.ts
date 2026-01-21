import {
    Injectable,
    CanActivate,
    ExecutionContext,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';

@Injectable()
export class CampaignOwnerGuard implements CanActivate {
    constructor(private prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<{
            user: JwtPayload;
            params: { id: string };
        }>();

        const userId = request.user?.sub;
        const campaignId = request.params?.id;

        if (!userId || !campaignId) {
            throw new ForbiddenException('Access denied');
        }

        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { userId: true },
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        if (campaign.userId !== userId) {
            throw new ForbiddenException('You do not have permission to access this campaign');
        }

        return true;
    }
}
