import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class Child {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  age: number;
}

const ChildSchema = SchemaFactory.createForClass(Child);

@Schema()
export class AssessmentResult {
  @Prop()
  score: number;

  @Prop()
  feedback: string;

  @Prop({ enum: ['Approved', 'Rejected'] })
  decision: string;
}

@Schema()
export class NannyProfile {
  @Prop()
  phone: string;

  @Prop()
  location: string;

  @Prop()
  description: string;

  @Prop()
  experience: string;

  @Prop([String])
  certifications: string[];

  @Prop()
  availability: string;

  @Prop([String])
  availableDates: string[];

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  ratingCount: number;
}

@Schema()
export class Subscription {
  @Prop({ enum: ['parent_monthly', 'parent_yearly'] })
  plan: string;

  @Prop({ enum: ['active', 'canceled'], default: 'active' })
  status: string;

  @Prop()
  renewalDate: string;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: ['parent', 'nanny'] })
  userType: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  photo: string;

  @Prop()
  phone: string;

  // NEW: Online Status & Last Seen
  @Prop({ enum: ['online', 'offline'], default: 'offline' })
  status: string;

  @Prop()
  lastSeen: Date;

  @Prop()
  location: string;

  // Parent specific fields
  @Prop({ type: [ChildSchema], default: [] })
  children: Child[];

  @Prop([String])
  interests: string[];

  @Prop([String])
  skillsToTeach: string[];

  // Nanny specific fields
  @Prop({ type: AssessmentResult })
  assessmentResult: AssessmentResult;

  @Prop({ default: 0 })
  assessmentAttempts: number;

  @Prop()
  suspendedUntil: Date;

  @Prop({ type: NannyProfile })
  profile: NannyProfile;

  @Prop({ type: Subscription })
  subscription: Subscription;

  @Prop([String])
  addedNannyIds: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);