import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CampaignStatus } from '@prisma/client';
import { CreateCampaignDto, UpdateCampaignDto, ScheduleCampaignDto, CampaignQueryDto } from './dto';

@Injectable()
export class CampaignService {
    constructor(private prisma: PrismaService) {}

    async create(userId: string, createCampaignDto: CreateCampaignDto) {
        return this.prisma.campaign.create({
            data: {
                ...createCampaignDto,
                recipients: createCampaignDto.recipients ?? [],
                userId,
            },
        });
    }

    async findAll(userId: string, query: CampaignQueryDto) {
        const { status, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const where = {
            userId,
            ...(status && { status }),
        };

        const [campaigns, total] = await Promise.all([
            this.prisma.campaign.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    subject: true,
                    status: true,
                    scheduledAt: true,
                    sentAt: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { emailLogs: true },
                    },
                },
            }),
            this.prisma.campaign.count({ where }),
        ]);

        return {
            data: campaigns.map((campaign) => ({
                ...campaign,
                recipientCount: campaign._count.emailLogs,
                _count: undefined,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { emailLogs: true },
                },
            },
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        return {
            ...campaign,
            recipientCount: campaign._count.emailLogs,
            _count: undefined,
        };
    }

    async update(id: string, updateCampaignDto: UpdateCampaignDto) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        // Prevent updating campaigns that are being sent or already sent
        if (campaign.status === CampaignStatus.SENDING || campaign.status === CampaignStatus.SENT) {
            throw new BadRequestException(`Cannot update campaign with status: ${campaign.status}`);
        }

        return this.prisma.campaign.update({
            where: { id },
            data: updateCampaignDto,
        });
    }

    async remove(id: string) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        // Prevent deleting campaigns that are being sent
        if (campaign.status === CampaignStatus.SENDING) {
            throw new BadRequestException('Cannot delete campaign while it is being sent');
        }

        await this.prisma.campaign.delete({
            where: { id },
        });

        return { message: 'Campaign deleted successfully' };
    }

    async schedule(id: string, scheduleCampaignDto: ScheduleCampaignDto) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        // Only DRAFT campaigns can be scheduled
        if (campaign.status !== CampaignStatus.DRAFT) {
            throw new BadRequestException(
                `Cannot schedule campaign with status: ${campaign.status}. Only DRAFT campaigns can be scheduled.`,
            );
        }

        // Validate recipients exist
        if (!campaign.recipients || campaign.recipients.length === 0) {
            throw new BadRequestException(
                'Campaign must have at least one recipient before scheduling',
            );
        }

        // Validate scheduled time is in the future
        const scheduledAt = new Date(scheduleCampaignDto.scheduledAt);
        if (scheduledAt <= new Date()) {
            throw new BadRequestException('Scheduled time must be in the future');
        }

        return this.prisma.campaign.update({
            where: { id },
            data: {
                status: CampaignStatus.SCHEDULED,
                scheduledAt,
            },
        });
    }

    async cancelSchedule(id: string) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id },
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        if (campaign.status !== CampaignStatus.SCHEDULED) {
            throw new BadRequestException(
                `Cannot cancel schedule for campaign with status: ${campaign.status}`,
            );
        }

        return this.prisma.campaign.update({
            where: { id },
            data: {
                status: CampaignStatus.DRAFT,
                scheduledAt: null,
            },
        });
    }

    async getStats(userId: string) {
        const stats = await this.prisma.campaign.groupBy({
            by: ['status'],
            where: { userId },
            _count: { status: true },
        });

        const total = await this.prisma.campaign.count({
            where: { userId },
        });

        const statusCounts = stats.reduce(
            (acc, item) => {
                acc[item.status.toLowerCase()] = item._count.status;
                return acc;
            },
            {} as Record<string, number>,
        );

        return {
            total,
            ...statusCounts,
        };
    }
}
