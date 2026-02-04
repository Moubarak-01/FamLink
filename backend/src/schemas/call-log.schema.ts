import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CallLogDocument = CallLog & Document;

@Schema({ timestamps: true })
export class CallLog {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    callerId: Types.ObjectId;

    @Prop({ required: true })
    callerName: string;

    @Prop()
    callerPhoto?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    receiverId: Types.ObjectId;

    @Prop({ required: true })
    receiverName: string;

    @Prop()
    receiverPhoto?: string;

    @Prop({ enum: ['video', 'voice'], default: 'video' })
    callType: 'video' | 'voice';

    @Prop({ enum: ['missed', 'completed', 'rejected', 'no_answer'], default: 'missed' })
    status: 'missed' | 'completed' | 'rejected' | 'no_answer';

    @Prop({ default: 0 })
    duration: number; // in seconds

    @Prop({ type: Date, default: Date.now })
    startedAt: Date;

    @Prop({ type: Date })
    endedAt?: Date;
}

export const CallLogSchema = SchemaFactory.createForClass(CallLog);

// Index for efficient queries
CallLogSchema.index({ callerId: 1, createdAt: -1 });
CallLogSchema.index({ receiverId: 1, createdAt: -1 });
