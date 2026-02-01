import { Controller, Post, Body, Logger } from '@nestjs/common';

interface TelemetryLog {
    service: string;
    event: string;
    model?: string;
    success: boolean;
    error?: string;
    timestamp?: string;
}

@Controller('telemetry')
export class TelemetryController {
    private readonly logger = new Logger(TelemetryController.name);

    @Post('log')
    logEvent(@Body() data: TelemetryLog) {
        const timestamp = new Date().toISOString();
        const prefix = `[${data.service || 'UnknownService'}]`;

        if (data.success) {
            if (data.event === 'ai_generation' || data.event === 'ai_assessment') {
                this.logger.log(`${prefix} ✅ Success with model: ${data.model || 'unknown'}`);
            } else {
                this.logger.log(`${prefix} ℹ️ ${data.event}`);
            }
        } else {
            this.logger.error(`${prefix} ❌ Failed: ${data.error || 'Unknown error'}`);
        }

        return { received: true };
    }
}
