import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type OutingDocument = Outing & Document;

@Schema()
export class OutingRequest {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  parentId: string;

  @Prop({ required: true })
  childName: string;

  @Prop({ required: true })
  childAge: number;

  @Prop({ required: true })
  emergencyContactName: string;

  @Prop({ required: true })
  emergencyContactPhone: string;

  @Prop({ enum: ['pending', 'accepted', 'declined'], default: 'pending' })
  status: string;
}

const OutingRequestSchema = SchemaFactory.createForClass(OutingRequest);

@Schema({ timestamps: true })
export class Outing {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  hostId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  location: string;

  @Prop({ default: false })
  liveLocationEnabled: boolean;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  time: string;

  @Prop({ required: true })
  maxChildren: number;

  @Prop()
  costDetails: string;

  @Prop()
  image: string; // Base64 image string

  @Prop({ type: String, enum: ['public', 'private'], default: 'public' })
  privacy: string;

  @Prop({ type: [OutingRequestSchema], default: [] })
  requests: OutingRequest[];
}

export const OutingSchema = SchemaFactory.createForClass(Outing);