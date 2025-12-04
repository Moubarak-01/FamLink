import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from '../schemas/activity.schema';

@Injectable()
export class ActivitiesService {
  constructor(@InjectModel(Activity.name) private activityModel: Model<ActivityDocument>) {}

  async create(createActivityDto: any, userId: string): Promise<ActivityDocument> {
    const createdActivity = new this.activityModel({
      ...createActivityDto,
      hostId: userId,
      participants: [userId],
    });
    return createdActivity.save();
  }

  async findAll(): Promise<ActivityDocument[]> {
    // Populate hostId to ensure frontend gets user details
    return this.activityModel.find()
      .populate('hostId', 'fullName photo')
      .sort({ createdAt: -1 })
      .exec();
  }

  async join(activityId: string, userId: string): Promise<ActivityDocument> {
    return this.activityModel.findByIdAndUpdate(
      activityId,
      { $addToSet: { participants: userId } },
      { new: true }
    ).exec();
  }
  
  async delete(id: string): Promise<any> {
      return this.activityModel.findByIdAndDelete(id).exec();
  }

  async deleteAll(): Promise<any> {
      return this.activityModel.deleteMany({}).exec();
  }
}