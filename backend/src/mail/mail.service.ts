import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
    private resend: Resend;
    private readonly logger = new Logger(MailService.name);

    constructor() {
        this.resend = new Resend(process.env.MAIL_API_KEY);
    }

    async sendVerificationEmail(email: string, token: string) {
        const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

        try {
            this.logger.log(`Sending verification email to ${email}`);
            this.logger.log(`DEBUG: Verification URL: ${verificationUrl}`);
            // Append to log file for testing access
            const fs = require('fs');
            fs.appendFileSync('verification_links.log', `${new Date().toISOString()} - ${verificationUrl}\n`);

            const response = await this.resend.emails.send({
                from: 'FamLink <onboarding@resend.dev>', // Use resend.dev for testing unless they have a domain
                to: [email],
                subject: 'Verify your FamLink Account',
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Welcome to FamLink! 🌟</h1>
            <p>Please click the button below to verify your email address and start using FamLink.</p>
            <a href="${verificationUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Verify Email</a>
            <p style="margin-top: 24px; color: #666;">Or copy this link: <br>${verificationUrl}</p>
          </div>
        `,
            });

            if (response.error) {
                throw new Error(response.error.message);
            }

            this.logger.log(`Email sent successfully: ${response.data?.id}`);
            return response.data;
        } catch (error) {
            this.logger.error('Failed to send verification email (likely due to free tier restrictions). Continuing registration process...', error);
            // In development, we don't want to block registration just because email failed. 
            // The link is already logged above.
            return { id: 'mock-email-id' };
        }
    }
}
