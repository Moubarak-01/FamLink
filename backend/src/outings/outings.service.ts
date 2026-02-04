import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Outing, OutingDocument } from '../schemas/outing.schema';
import { NotificationsService } from '../notifications/notifications.service';

import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class OutingsService {
  constructor(
    @InjectModel(Outing.name) private outingModel: Model<OutingDocument>,
    private notificationsService: NotificationsService,
    private chatGateway: ChatGateway
  ) { }

  async create(createOutingDto: any, userId: string): Promise<OutingDocument> {
    const createdOuting = new this.outingModel({
      ...createOutingDto,
      hostId: userId,
      privacy: createOutingDto.privacy || 'public'
    });
    const saved = await createdOuting.save();
    await saved.populate('hostId', 'fullName photo isVerified');
    this.chatGateway.server.emit('outings_update', { action: 'create' });
    return saved;
  }

  async findAll(): Promise<OutingDocument[]> {
    return this.outingModel.find()
      .populate('hostId', 'fullName photo isVerified')
      .sort({ createdAt: -1 })
      .exec();
  }

  async requestJoin(outingId: string, requestDto: any, userId: string): Promise<OutingDocument> {
    const outing = await this.outingModel.findById(outingId);
    if (!outing) throw new Error('Outing not found');

    // Prevent duplicate requests
    const existingRequest = outing.requests.find(r => r.parentId === userId);
    if (existingRequest) {
      throw new Error('You have already requested to join this outing.');
    }

    const isPublic = outing.privacy === 'public';
    // If public, status is accepted immediately. If private, pending.
    const status = isPublic ? 'accepted' : 'pending';

    const request = { ...requestDto, parentId: userId, status };

    const updated = await this.outingModel.findByIdAndUpdate(
      outingId,
      { $push: { requests: request } },
      { new: true }
    ).populate('hostId', 'fullName photo isVerified').exec();

    this.chatGateway.server.emit('outings_update', { action: 'request_join', outingId });

    // NOTIFICATION LOGIC
    if (updated && outing.hostId) {
      const hostIdStr = typeof outing.hostId === 'object' ? (outing.hostId as any)._id.toString() : outing.hostId.toString();
      // If Request (Private): Notify Host "User requested to join"
      // If Join (Public): Notify Host "User joined"
      const message = isPublic
        ? `New participant in "${outing.title}"`
        : `Request to join "${outing.title}"`;

      // Don't notify if host is joining their own event (edge case)
      if (hostIdStr !== userId) {
        const type = isPublic ? 'outing_joined' : 'outing_request';
        await this.notificationsService.create(
          hostIdStr,
          message,
          type,
          outingId,
          { title: outing.title }
        );
      }
    }

    return updated;
  }

  async updateRequestStatus(outingId: string, parentId: string, status: string): Promise<OutingDocument> {
    const updated = await this.outingModel.findOneAndUpdate(
      { _id: outingId, "requests.parentId": parentId },
      { $set: { "requests.$.status": status } },
      { new: true }
    ).populate('hostId', 'fullName photo isVerified').exec();

    this.chatGateway.server.emit('outings_update', { action: 'request_status', outingId });

    // Notify the Requester (Parent)
    if (updated) {
      const message = `Your request to join "${updated.title}" was ${status}`;
      const type = status === 'accepted' ? 'outing_status_accepted' : 'outing_status_declined';
      await this.notificationsService.create(
        parentId,
        message,
        type,
        outingId,
        { title: updated.title }
      );
    }

    return updated;
  }

  async delete(id: string): Promise<any> {
    const deleted = await this.outingModel.findByIdAndDelete(id).exec();
    this.chatGateway.server.emit('outings_update', { action: 'delete', id });
    return deleted;
  }

  async deleteAll(): Promise<any> {
    return this.outingModel.deleteMany({}).exec();
  }
}