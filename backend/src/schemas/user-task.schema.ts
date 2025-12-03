
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserTaskDocument = UserTask & Document;

@Schema({ timestamps: true })
export class UserTask {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  parentId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  nannyId: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  dueDate: string; // YYYY-MM-DD

  @Prop({ enum: ['pending', 'completed'], default: 'pending' })
  status: string;
}

export const UserTaskSchema = SchemaFactory.createForClass(UserTask);
