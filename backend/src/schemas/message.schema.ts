import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema()
export class Reaction {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  emoji: string;
}

const ReactionSchema = SchemaFactory.createForClass(Reaction);

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  roomId: string; // Acts as threadId

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: string;

  // receiverId is optional for group chats
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  receiverId: string;

  @Prop({ required: true })
  text: string; // Ciphertext

  @Prop({ required: true })
  mac: string;

  @Prop({ enum: ['sent', 'delivered', 'seen'], default: 'sent' })
  status: string;

  @Prop({ type: [ReactionSchema], default: [] })
  reactions: Reaction[];

  @Prop({ type: String, default: null })
  replyTo: string | null;

  @Prop({ default: false })
  deleted: boolean;

  @Prop()
  deletedAt: Date;

  @Prop()
  deliveredAt: Date;

  @Prop()
  seenAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ roomId: 1, createdAt: 1 });