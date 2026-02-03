import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';
import { FirebaseService } from './firebase.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private notificationsGateway: NotificationsGateway,
    private firebaseService: FirebaseService,
    @Inject(forwardRef(() => UsersService)) private usersService: UsersService
  ) { }

  async create(userId: string, message: string, type: string, relatedId?: string): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      userId,
      message,
      type,
      relatedId,
      read: false,
    });
    const savedNotification = await notification.save();

    // Send real-time update via Socket.io
    this.notificationsGateway.sendNotification(userId, {
      id: savedNotification._id.toString(),
      userId,
      message,
      type,
      read: false,
      relatedId,
      createdAt: savedNotification['createdAt']
    });

    // Send Push Notification
    try {
      const user = await this.usersService.findOneById(userId);
      if (user && user.fcmToken) {
        await this.firebaseService.sendToDevice(
          user.fcmToken,
          'FamLink', // Title
          message,
          {
            type,
            relatedId: relatedId || '',
            notificationId: savedNotification._id.toString()
          }
        );
      }
    } catch (error) {
      console.error(`Failed to send push notification to user ${userId}:`, error);
    }

    return savedNotification;
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