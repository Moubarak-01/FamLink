import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserTask, UserTaskDocument } from '../schemas/user-task.schema';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(UserTask.name) private userTaskModel: Model<UserTaskDocument>,
  ) {}

  async create(taskData: any): Promise<UserTask> {
    const createdTask = new this.userTaskModel(taskData);
    return createdTask.save();
  }

  async updateStatus(taskId: string, status: string): Promise<UserTask> {
    const updatedTask = await this.userTaskModel.findByIdAndUpdate(
      taskId,
      { status },
      { new: true },
    );
    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }
    return updatedTask;
  }

  async getAllTasksByUser(userId: string): Promise<UserTask[]> {
    return this.userTaskModel.find({
      $or: [{ parentId: userId }, { nannyId: userId }],
    }).exec();
  }
}
