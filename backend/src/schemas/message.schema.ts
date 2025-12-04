import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  roomId: string; 

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: string;

  // Crucial for tracking delivery status to a specific person
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  receiverId: string;

  @Prop({ required: true })
  text: string;
  
  @Prop({ enum: ['sent', 'delivered', 'seen'], default: 'sent' })
  status: string;

  @Prop()
  deliveredAt: Date;

  @Prop()
  seenAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
// Index for fast lookups of undelivered messages
MessageSchema.index({ receiverId: 1, status: 1 });