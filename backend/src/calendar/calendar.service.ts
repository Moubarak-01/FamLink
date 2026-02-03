import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { UsersService } from '../users/users.service';

@Injectable()
export class CalendarService {
    private readonly logger = new Logger(CalendarService.name);
    private oauth2Client;

    constructor(private usersService: UsersService) {
        // Sanitize environment variables to remove any partial copy/paste whitespace
        const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
        const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
        const callbackUrl = (process.env.GOOGLE_CALLBACK_URL || '').trim();

        if (!clientId || !clientSecret || !callbackUrl) {
            this.logger.error('Google Calendar credentials missing in .env');
        }

        this.oauth2Client = new google.auth.OAuth2({
            clientId,
            clientSecret,
            redirectUri: callbackUrl
        });
    }

    getAuthUrl(userId: string) {
        const scopes = ['https://www.googleapis.com/auth/calendar.events'];

        // Generate a URL that asks permissions for Google Calendar scopes
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline', // crucial for getting a refresh_token
            scope: scopes,
            prompt: 'consent', // force consent to ensure refresh_token is returned
            state: userId // pass userId to callback to know who is authenticating
        });
    }

    async handleCallback(code: string, userId: string) {
        try {
            // Explicitly pass options to ensure correct redirect_uri is used
            const { tokens } = await this.oauth2Client.getToken({
                code,
                redirect_uri: (process.env.GOOGLE_CALLBACK_URL || '').trim() // Force the correct URI
            });

            if (tokens.refresh_token) {
                // Save refresh token to user
                await this.usersService.updateGoogleToken(userId, tokens.refresh_token);
                this.logger.log(`Google Calendar connected for user ${userId}`);
                return { success: true };
            } else {
                this.logger.warn(`No refresh token returned for user ${userId}. Might need to revoke app access to re-trigger consent.`);
                // If user already authorized, google doesn't send refresh token again unless prompt='consent' is used.
                // We configured prompt='consent' so it should be fine.
                return { success: true }; // Still successful if access token works
            }
        } catch (error) {
            this.logger.error('Error exchanging google code for tokens', error);
            throw error;
        }
    }

    async createEvent(userId: string, booking: any) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.googleRefreshToken) {
            this.logger.warn(`User ${userId} does not have Google Calendar connected. Skipping event creation.`);
            return;
        }

        this.oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        // Parse the booking date
        const bookingDate = new Date(booking.date);
        // Format as YYYY-MM-DD
        const startDateStr = bookingDate.toISOString().split('T')[0];

        // Calculate end date (start date + 1 day) for all-day event
        const endDate = new Date(bookingDate);
        endDate.setDate(endDate.getDate() + 1);
        const endDateStr = endDate.toISOString().split('T')[0];

        const event = {
            summary: `FamLink Booking with ${booking.nannyName || 'Nanny'}`,
            description: `Babysitting booking via FamLink.`,
            start: {
                date: startDateStr, // All-day event start
            },
            end: {
                date: endDateStr,   // All-day event end (exclusive)
            },
        };

        try {
            await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
            });
            this.logger.log(`Calendar event created for user ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to create calendar event for user ${userId}`, error);
        }
    }
}
