import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SkillTaskDocument = SkillTask & Document;

@Schema()
export class SkillOffer {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  helperId: string;

  @Prop({ required: true })
  offerAmount: number;

  @Prop()
  message: string;

  @Prop({ enum: ['pending', 'accepted', 'declined'], default: 'pending' })
  status: string;
}

const SkillOfferSchema = SchemaFactory.createForClass(SkillOffer);

@Schema({ timestamps: true })
export class SkillTask {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  requesterId: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  budget: number;

  @Prop()
  image: string; // Base64 image string

  @Prop({ enum: ['open', 'in_progress', 'completed'], default: 'open' })
  status: string;

  @Prop({ type: [SkillOfferSchema], default: [] })
  offers: SkillOffer[];
}

export const SkillTaskSchema = SchemaFactory.createForClass(SkillTask);