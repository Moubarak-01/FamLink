
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
      participants: [userId], // Host is automatically a participant
    });
    return createdActivity.save();
  }

  async findAll(): Promise<ActivityDocument[]> {
    return this.activityModel.find().populate('hostId', 'fullName photo').exec();
  }

  async join(activityId: string, userId: string): Promise<ActivityDocument> {
    return this.activityModel.findByIdAndUpdate(
      activityId,
      { $addToSet: { participants: userId } },
      { new: true }
    ).exec();
  }
  
  async findOne(id: string): Promise<ActivityDocument> {
      return this.activityModel.findById(id).exec();
  }
}
