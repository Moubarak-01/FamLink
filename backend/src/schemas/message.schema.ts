import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  roomId: string; 

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: string;

  @Prop({ required: true })
  text: string;
  
  @Prop({ enum: ['sent', 'delivered', 'seen'], default: 'sent' })
  status: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);