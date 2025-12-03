import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  parentId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  nannyId: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop()
  message: string;

  @Prop({ enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'], default: 'pending' })
  status: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);