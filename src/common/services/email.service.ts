import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface SendEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly fromEmail: string;
    private readonly fromName: string;
    private readonly isConfigured: boolean;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
        this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL') ?? '';
        this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME') ?? 'Email Campaign';

        if (apiKey && apiKey.startsWith('SG.')) {
            sgMail.setApiKey(apiKey);
            this.isConfigured = true;
            this.logger.log('SendGrid configured successfully');
        } else {
            this.isConfigured = false;
            this.logger.warn('SendGrid API key not configured - emails will be simulated');
        }
    }

    async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
        const { to, subject, html, text } = options;

        // If SendGrid is not configured, simulate sending
        if (!this.isConfigured) {
            return this.simulateEmail(to, subject);
        }

        try {
            const [response] = await sgMail.send({
                to,
                from: {
                    email: this.fromEmail,
                    name: this.fromName,
                },
                subject,
                html,
                text: text ?? this.stripHtml(html),
            });

            this.logger.log(`Email sent to ${to} - Status: ${response.statusCode}`);

            return {
                success: true,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                messageId: response.headers['x-message-id'] as string,
            };
        } catch (error) {
            const errorMessage = this.extractErrorMessage(error);
            this.logger.error(`Failed to send email to ${to}: ${errorMessage}`);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    private async simulateEmail(to: string, subject: string): Promise<SendEmailResult> {
        this.logger.debug(`[SIMULATED] Sending email to ${to}: ${subject}`);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));

        // Simulate 5% failure rate in development
        if (Math.random() < 0.05) {
            return {
                success: false,
                error: 'Simulated email failure',
            };
        }

        return {
            success: true,
            messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };
    }

    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, '').trim();
    }

    private extractErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            // SendGrid specific error handling
            const sgError = error as Error & {
                response?: { body?: { errors?: Array<{ message: string }> } };
            };
            if (sgError.response?.body?.errors?.[0]?.message) {
                return sgError.response.body.errors[0].message;
            }
            return error.message;
        }
        return String(error);
    }
}
