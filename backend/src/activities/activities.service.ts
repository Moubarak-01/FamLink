import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from '../schemas/activity.schema';

import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    private chatGateway: ChatGateway,
    private notificationsService: NotificationsService
  ) { }

  async create(createActivityDto: any, userId: string): Promise<ActivityDocument> {
    const createdActivity = new this.activityModel({
      ...createActivityDto,
      hostId: userId,
      participants: [userId],
      privacy: createActivityDto.privacy || 'public',
      requests: []
    });
    const saved = await createdActivity.save();
    this.chatGateway.server.emit('activity_update', { action: 'create' });
    return saved;
  }

  async findAll(): Promise<ActivityDocument[]> {
    return this.activityModel.find()
      .populate('hostId', 'fullName photo')
      .sort({ createdAt: -1 })
      .exec();
  }

  async join(activityId: string, userId: string): Promise<ActivityDocument> {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    // Check if pending request exists
    const existingReq = activity.requests.find(r => r.userId.toString() === userId && r.status === 'pending');
    if (existingReq) {
      throw new BadRequestException('Request already pending');
    }

    // Check if already participant
    if (activity.participants.includes(userId)) {
      return activity;
    }

    if (activity.privacy === 'private') {
      // Logic: Add to requests
      activity.requests.push({ userId, status: 'pending', timestamp: new Date() });
      const saved = await activity.save();

      this.chatGateway.server.emit('activity_update', { action: 'request_join', activityId, userId });

      // Notify Host
      // We need to fetch host first? No, hostId is on activity.
      const hostIdStr = activity.hostId.toString(); // hostId might be ObjectId or String depending on load... Mongoose usually makes it ObjectId unless populated? 
      // findAll populates it. findById did NOT populate it here.

      await this.notificationsService.create(
        hostIdStr,
        'New request to join your activity',
        'activity_request',
        activityId,
        { activityId }
      );

      return saved;
    } else {
      // Public Logic
      activity.participants.push(userId);
      const saved = await activity.save();
      this.chatGateway.server.emit('activity_update', { action: 'join', activityId });
      return saved;
    }
  }

  async approveRequest(activityId: string, userId: string, hostId: string): Promise<ActivityDocument> {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    // Ensure current user is HOST
    if (activity.hostId.toString() !== hostId) {
      throw new ForbiddenException('Only the host can approve requests');
    }

    const reqIndex = activity.requests.findIndex(r => r.userId.toString() === userId && r.status === 'pending');
    if (reqIndex === -1) throw new NotFoundException('Pending request not found');

    activity.requests[reqIndex].status = 'accepted';

    // Add to participants if not already matches
    const uidStr = userId.toString();
    if (!activity.participants.includes(uidStr)) {
      activity.participants.push(uidStr);
    }

    const saved = await activity.save();

    // Notify Requester
    this.chatGateway.server.emit('activity_update', { action: 'approve_request', activityId, userId });
    await this.notificationsService.create(
      userId,
      'Your request to join an activity was approved! You can now chat.',
      'activity_approved',
      activityId,
      { activityId }
    );

    return saved;
  }

  async declineRequest(activityId: string, userId: string, hostId: string): Promise<ActivityDocument> {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    if (activity.hostId.toString() !== hostId) throw new ForbiddenException('Only host can decline');

    const reqIndex = activity.requests.findIndex(r => r.userId.toString() === userId && r.status === 'pending');
    if (reqIndex === -1) throw new NotFoundException('Request not found');

    activity.requests[reqIndex].status = 'declined';
    const saved = await activity.save();

    this.chatGateway.server.emit('activity_update', { action: 'decline_request', activityId, userId });
    return saved;
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