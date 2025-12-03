
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserTask, UserTaskDocument } from '../schemas/user-task.schema';

@Injectable()
export class UserTasksService {
  constructor(@InjectModel(UserTask.name) private userTaskModel: Model<UserTaskDocument>) {}

  async create(createTaskDto: any, parentId: string): Promise<UserTaskDocument> {
    const task = new this.userTaskModel({
      ...createTaskDto,
      parentId,
    });
    return task.save();
  }

  async findAllForUser(userId: string): Promise<UserTaskDocument[]> {
    // Return tasks where the user is either the parent (assigner) or the nanny (assignee)
    return this.userTaskModel.find({
      $or: [{ parentId: userId }, { nannyId: userId }]
    }).sort({ dueDate: 1 }).exec();
  }

  async updateStatus(taskId: string, status: string): Promise<UserTaskDocument> {
    return this.userTaskModel.findByIdAndUpdate(taskId, { status }, { new: true }).exec();
  }
}
