import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { CallLogService } from './call-log.service';

@Controller('api/call-logs')
export class CallLogController {
    constructor(private readonly callLogService: CallLogService) { }

    @Get(':userId')
    async getCallHistory(
        @Param('userId') userId: string,
        @Query('limit') limit?: string,
    ) {
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        const calls = await this.callLogService.getCallHistory(userId, parsedLimit);
        return calls.map(call => ({
            id: call._id,
            callerId: call.callerId,
            callerName: call.callerName,
            callerPhoto: call.callerPhoto,
            receiverId: call.receiverId,
            receiverName: call.receiverName,
            receiverPhoto: call.receiverPhoto,
            callType: call.callType,
            status: call.status,
            duration: call.duration,
            startedAt: call.startedAt,
            endedAt: call.endedAt,
            createdAt: (call as any).createdAt,
        }));
    }

    @Get(':userId/stats')
    async getCallStats(@Param('userId') userId: string) {
        return this.callLogService.getCallStats(userId);
    }

    @Delete(':userId')
    async clearCallHistory(@Param('userId') userId: string) {
        await this.callLogService.deleteCallHistory(userId);
        return { success: true, message: 'Call history cleared' };
    }
}
