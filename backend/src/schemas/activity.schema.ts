import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ timestamps: true })
export class Activity {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  hostId: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop({ required: true })
  time: string; // HH:MM

  @Prop({ type: String, enum: ['public', 'private'], default: 'public' })
  privacy: string;

  @Prop({
    type: [{
      userId: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
      timestamp: { type: Date, default: Date.now }
    }],
    default: []
  })
  requests: { userId: string, status: string, timestamp: Date }[];

  @Prop()
  image: string; // Base64 image string

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  participants: string[];
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);