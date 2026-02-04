import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserTask, UserTaskDocument } from '../schemas/user-task.schema';
import { NotificationsService } from '../notifications/notifications.service';

import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class UserTasksService {
  constructor(
    @InjectModel(UserTask.name) private userTaskModel: Model<UserTaskDocument>,
    private notificationsService: NotificationsService,
    private chatGateway: ChatGateway
  ) { }

  async create(createTaskDto: any, parentId: string): Promise<UserTaskDocument> {
    const task = new this.userTaskModel({
      ...createTaskDto,
      parentId,
    });
    const savedTask = await task.save();

    await this.notificationsService.create(
      createTaskDto.nannyId,
      `New task assigned: ${createTaskDto.description}`,
      'task',
      savedTask._id.toString(),
      { description: createTaskDto.description }
    );

    this.chatGateway.server.emit('tasks_update', { action: 'create', taskId: savedTask._id });
    return savedTask;
  }

  async findAllForUser(userId: string): Promise<UserTaskDocument[]> {
    // Feature: 7-day expiration logic
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.userTaskModel.find({
      $or: [{ parentId: userId }, { nannyId: userId }],
      // Filter out tasks that are completed, NOT marked to keep, and older than 7 days
      $nor: [
        {
          status: 'completed',
          keepPermanently: false,
          completedAt: { $lt: sevenDaysAgo }
        }
      ]
    }).sort({ dueDate: 1 }).exec();
  }

  async updateStatus(taskId: string, status: string): Promise<UserTaskDocument> {
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
    const res = await this.userTaskModel.findByIdAndUpdate(taskId, updateData, { new: true }).exec();
    this.chatGateway.server.emit('tasks_update', { action: 'update_status', taskId });
    return res;
  }

  async keepTaskPermanently(taskId: string): Promise<UserTaskDocument> {
    const res = await this.userTaskModel.findByIdAndUpdate(taskId, { keepPermanently: true }, { new: true }).exec();
    this.chatGateway.server.emit('tasks_update', { action: 'keep_permanent', taskId });
    return res;
  }

  async remove(id: string): Promise<any> {
    const res = await this.userTaskModel.findByIdAndDelete(id).exec();
    this.chatGateway.server.emit('tasks_update', { action: 'delete', id });
    return res;
  }
}