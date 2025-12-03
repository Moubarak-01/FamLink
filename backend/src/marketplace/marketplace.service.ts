
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SkillTask, SkillTaskDocument } from '../schemas/task.schema';

@Injectable()
export class MarketplaceService {
  constructor(@InjectModel(SkillTask.name) private skillTaskModel: Model<SkillTaskDocument>) {}

  async create(createTaskDto: any, userId: string): Promise<SkillTaskDocument> {
    const createdTask = new this.skillTaskModel({
      ...createTaskDto,
      requesterId: userId,
    });
    return createdTask.save();
  }

  async findAll(): Promise<SkillTaskDocument[]> {
    return this.skillTaskModel.find()
      .populate('requesterId', 'fullName photo')
      .populate('offers.helperId', 'fullName photo')
      .exec();
  }

  async makeOffer(taskId: string, offerDto: any, userId: string): Promise<SkillTaskDocument> {
      const offer = { ...offerDto, helperId: userId, status: 'pending' };
      return this.skillTaskModel.findByIdAndUpdate(
          taskId,
          { $push: { offers: offer } },
          { new: true }
      ).exec();
  }

  async updateOfferStatus(taskId: string, helperId: string, status: string): Promise<SkillTaskDocument> {
      const task = await this.skillTaskModel.findOneAndUpdate(
           { _id: taskId, "offers.helperId": helperId },
           { $set: { "offers.$.status": status } },
           { new: true }
       ).exec();
       
       if (status === 'accepted' && task) {
           // If accepted, set task status to in_progress
           task.status = 'in_progress';
           await task.save();
       }
       
       return task;
  }
}
