
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>) {}

  async create(userId: string, message: string, type: string, relatedId?: string): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      userId,
      message,
      type,
      relatedId,
      read: false,
    });
    return notification.save();
  }

  async findAllForUser(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async markAsRead(id: string): Promise<NotificationDocument> {
    return this.notificationModel.findByIdAndUpdate(id, { read: true }, { new: true }).exec();
  }
  
  async markAllAsRead(userId: string): Promise<void> {
      await this.notificationModel.updateMany({ userId, read: false }, { read: true }).exec();
  }
}
