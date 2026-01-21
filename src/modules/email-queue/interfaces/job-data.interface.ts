export interface CampaignJobData {
    campaignId: string;
    userId: string;
}

export interface EmailJobData {
    campaignId: string;
    emailLogId: string;
    recipient: string;
    subject: string;
    content: string;
    attempt: number;
}

export interface EmailResult {
    success: boolean;
    emailLogId: string;
    recipient: string;
    error?: string;
}
