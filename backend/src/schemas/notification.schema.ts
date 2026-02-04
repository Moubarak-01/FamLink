import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: ['booking', 'task', 'system', 'chat', 'outing', 'skill', 'activity_request', 'activity_approved', 'activity_declined', 'chat_reaction', 'outing_request', 'outing_joined', 'outing_status_accepted', 'outing_status_declined', 'booking_accepted', 'booking_declined'] })
  type: string;

  @Prop({ type: Object })
  data: any;

  @Prop()
  relatedId: string;

  @Prop({ default: false })
  read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);