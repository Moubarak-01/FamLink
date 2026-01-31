import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from '../schemas/activity.schema';

import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    private chatGateway: ChatGateway
  ) { }

  async create(createActivityDto: any, userId: string): Promise<ActivityDocument> {
    const createdActivity = new this.activityModel({
      ...createActivityDto,
      hostId: userId,
      participants: [userId],
    });
    const saved = await createdActivity.save();
    this.chatGateway.server.emit('activity_update', { action: 'create' });
    return saved;
  }

  async findAll(): Promise<ActivityDocument[]> {
    // Populate hostId to ensure frontend gets user details
    return this.activityModel.find()
      .populate('hostId', 'fullName photo')
      .sort({ createdAt: -1 })
      .exec();
  }

  async join(activityId: string, userId: string): Promise<ActivityDocument> {
    const updated = await this.activityModel.findByIdAndUpdate(
      activityId,
      { $addToSet: { participants: userId } },
      { new: true }
    ).exec();
    this.chatGateway.server.emit('activity_update', { action: 'join' });
    return updated;
  }

  async delete(id: string): Promise<any> {
    const deleted = await this.activityModel.findByIdAndDelete(id).exec();
    this.chatGateway.server.emit('activity_update', { action: 'delete' });
    return deleted;
  }

  async deleteAll(): Promise<any> {
    const deleted = await this.activityModel.deleteMany({}).exec();
    this.chatGateway.server.emit('activity_update', { action: 'delete_all' });
    return deleted;
  }
}