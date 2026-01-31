import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SkillTask, SkillTaskDocument } from '../schemas/task.schema';

import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectModel(SkillTask.name) private skillTaskModel: Model<SkillTaskDocument>,
    private chatGateway: ChatGateway
  ) { }

  async create(createTaskDto: any, userId: string): Promise<SkillTaskDocument> {
    const createdTask = new this.skillTaskModel({
      ...createTaskDto,
      requesterId: userId,
      privacy: createTaskDto.privacy || 'public'
    });
    const saved = await createdTask.save();
    this.chatGateway.server.emit('marketplace_update', { action: 'create' });
    return saved;
  }

  async findAll(): Promise<SkillTaskDocument[]> {
    return this.skillTaskModel.find()
      .populate('requesterId', 'fullName photo')
      .populate('offers.helperId', 'fullName photo')
      .sort({ createdAt: -1 })
      .exec();
  }

  async makeOffer(taskId: string, offerDto: any, userId: string): Promise<SkillTaskDocument> {
    const offer = { ...offerDto, helperId: userId, status: 'pending' };
    const updated = await this.skillTaskModel.findByIdAndUpdate(
      taskId,
      { $push: { offers: offer } },
      { new: true }
    ).exec();
    this.chatGateway.server.emit('marketplace_update', { action: 'offer_made' });
    return updated;
  }

  async updateOfferStatus(taskId: string, helperId: string, status: string): Promise<SkillTaskDocument> {
    const task = await this.skillTaskModel.findOneAndUpdate(
      { _id: taskId, "offers.helperId": helperId },
      { $set: { "offers.$.status": status } },
      { new: true }
    ).exec();

    if (status === 'accepted' && task) {
      task.status = 'in_progress';
      await task.save();
    }
    this.chatGateway.server.emit('marketplace_update', { action: 'offer_status' });
    return task;
  }

  async delete(id: string): Promise<any> {
    const deleted = await this.skillTaskModel.findByIdAndDelete(id).exec();
    this.chatGateway.server.emit('marketplace_update', { action: 'delete' });
    return deleted;
  }

  async deleteAll(): Promise<any> {
    const deleted = await this.skillTaskModel.deleteMany({}).exec();
    this.chatGateway.server.emit('marketplace_update', { action: 'delete_all' });
    return deleted;
  }
}