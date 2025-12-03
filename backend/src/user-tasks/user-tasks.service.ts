import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserTask, UserTaskDocument } from '../schemas/user-task.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UserTasksService {
  constructor(
    @InjectModel(UserTask.name) private userTaskModel: Model<UserTaskDocument>,
    private notificationsService: NotificationsService
  ) {}

  async create(createTaskDto: any, parentId: string): Promise<UserTaskDocument> {
    const task = new this.userTaskModel({
      ...createTaskDto,
      parentId,
    });
    const savedTask = await task.save();

    // Notify the Nanny
    await this.notificationsService.create(
        createTaskDto.nannyId,
        `New task assigned: ${createTaskDto.description}`,
        'task',
        savedTask._id.toString()
    );

    return savedTask;
  }

  async findAllForUser(userId: string): Promise<UserTaskDocument[]> {
    return this.userTaskModel.find({
      $or: [{ parentId: userId }, { nannyId: userId }]
    }).sort({ dueDate: 1 }).exec();
  }

  async updateStatus(taskId: string, status: string): Promise<UserTaskDocument> {
    return this.userTaskModel.findByIdAndUpdate(taskId, { status }, { new: true }).exec();
  }
}