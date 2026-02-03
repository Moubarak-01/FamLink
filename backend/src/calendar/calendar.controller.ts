import { Controller, Get, Query, Res, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assuming you have this

@Controller('calendar')
export class CalendarController {
    constructor(private readonly calendarService: CalendarService) { }

    @UseGuards(JwtAuthGuard)
    @Get('auth-url')
    getAuthUrl(@Req() req) {
        const userId = req.user.userId;
        const url = this.calendarService.getAuthUrl(userId);
        return { url };
    }

    @Get('callback')
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
        if (!code) {
            throw new HttpException('No code provided', HttpStatus.BAD_REQUEST);
        }

        try {
            // 'state' parameter contains userId passed from getAuthUrl
            const userId = state;
            await this.calendarService.handleCallback(code, userId);

            // Redirect back to the frontend settings page with a success flag
            return res.redirect('http://localhost:3000?calendar_connected=true');
        } catch (error) {
            return res.redirect('http://localhost:3000?calendar_error=true');
        }
    }
}
