import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CallLog, CallLogDocument } from '../schemas/call-log.schema';

@Injectable()
export class CallLogService {
    constructor(
        @InjectModel(CallLog.name) private callLogModel: Model<CallLogDocument>,
    ) { }

    async createCallLog(data: {
        callerId: string;
        callerName: string;
        callerPhoto?: string;
        receiverId: string;
        receiverName: string;
        receiverPhoto?: string;
        callType?: 'video' | 'voice';
    }): Promise<CallLogDocument> {
        const callLog = new this.callLogModel({
            callerId: new Types.ObjectId(data.callerId),
            callerName: data.callerName,
            callerPhoto: data.callerPhoto,
            receiverId: new Types.ObjectId(data.receiverId),
            receiverName: data.receiverName,
            receiverPhoto: data.receiverPhoto,
            callType: data.callType || 'video',
            status: 'missed', // Default to missed, updated when answered
            startedAt: new Date(),
        });
        return callLog.save();
    }

    async updateCallStatus(
        callLogId: string,
        status: 'completed' | 'rejected' | 'no_answer',
        duration?: number,
    ): Promise<CallLogDocument | null> {
        const update: any = { status, endedAt: new Date() };
        if (duration !== undefined) {
            update.duration = duration;
        }
        return this.callLogModel.findByIdAndUpdate(callLogId, update, { new: true });
    }

    async getCallHistory(userId: string, limit = 50): Promise<CallLogDocument[]> {
        const userObjectId = new Types.ObjectId(userId);
        return this.callLogModel
            .find({
                $or: [{ callerId: userObjectId }, { receiverId: userObjectId }],
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }

    async getCallStats(userId: string): Promise<{
        totalCalls: number;
        missedCalls: number;
        completedCalls: number;
        totalDuration: number;
    }> {
        const userObjectId = new Types.ObjectId(userId);

        const stats = await this.callLogModel.aggregate([
            {
                $match: {
                    $or: [{ callerId: userObjectId }, { receiverId: userObjectId }],
                },
            },
            {
                $group: {
                    _id: null,
                    totalCalls: { $sum: 1 },
                    missedCalls: {
                        $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] },
                    },
                    completedCalls: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                    },
                    totalDuration: { $sum: '$duration' },
                },
            },
        ]);

        return stats[0] || { totalCalls: 0, missedCalls: 0, completedCalls: 0, totalDuration: 0 };
    }

    async deleteCallHistory(userId: string): Promise<void> {
        const userObjectId = new Types.ObjectId(userId);
        await this.callLogModel.deleteMany({
            $or: [{ callerId: userObjectId }, { receiverId: userObjectId }],
        });
    }

    async findActiveCall(callerId: string, receiverId: string): Promise<CallLogDocument | null> {
        return this.callLogModel.findOne({
            callerId: new Types.ObjectId(callerId),
            receiverId: new Types.ObjectId(receiverId),
            status: 'missed', // Active/pending calls have 'missed' status until answered
            endedAt: { $exists: false },
        }).sort({ createdAt: -1 });
    }
}
