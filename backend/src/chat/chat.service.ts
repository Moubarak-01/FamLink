import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { BookingDocument } from '../schemas/booking.schema';
import { ActivityDocument } from '../schemas/activity.schema';
import { OutingDocument } from '../schemas/outing.schema';
import { SkillTaskDocument } from '../schemas/task.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel('Booking') private bookingModel: Model<BookingDocument>,
    @InjectModel('Activity') private activityModel: Model<ActivityDocument>,
    @InjectModel('Outing') private outingModel: Model<OutingDocument>,
    @InjectModel('SkillTask') private skillTaskModel: Model<SkillTaskDocument>,
  ) {}

  // 1. Determine Receiver and Save
  async saveMessage(roomId: string, senderId: string, text: string): Promise<MessageDocument> {
    let receiverId = null;

    // Try to find receiver based on context (Best effort for 1-on-1)
    // This assumes roomId is the ID of the Booking/Activity
    const booking = await this.bookingModel.findById(roomId).exec();
    if (booking) {
        receiverId = booking.parentId === senderId ? booking.nannyId : booking.parentId;
    } else {
         const skill = await this.skillTaskModel.findById(roomId).exec();
         if (skill) {
             // Simplified: In a real app, find the specific offer chat partner
             receiverId = skill.requesterId === senderId ? null : skill.requesterId; 
         }
    }

    const message = new this.messageModel({
      roomId,
      senderId,
      receiverId, // Can be null for group chats
      text,
      status: 'sent'
    });
    return message.save();
  }

  async getMessages(roomId: string): Promise<MessageDocument[]> {
    return this.messageModel.find({ roomId })
      .populate('senderId', 'fullName photo')
      .sort({ createdAt: 1 })
      .exec();
  }

  // 2. USER ONLINE: Mark all 'sent' messages for this receiver as 'delivered'
  async markUndeliveredMessagesAsDelivered(userId: string): Promise<MessageDocument[]> {
    // Update DB
    await this.messageModel.updateMany(
      { receiverId: userId, status: 'sent' },
      { status: 'delivered', deliveredAt: new Date() }
    ).exec();

    // Return the updated messages so we can notify the senders
    return this.messageModel.find({ receiverId: userId, status: 'delivered' }).exec();
  }

  // 3. CHAT OPENED: Mark all 'delivered'/'sent' messages in room as 'seen'
  async markMessagesAsSeen(roomId: string, userId: string): Promise<void> {
    await this.messageModel.updateMany(
        { 
          roomId, 
          senderId: { $ne: userId }, // Messages sent BY others
          status: { $ne: 'seen' } 
        },
        { status: 'seen', seenAt: new Date() }
    ).exec();
  }

  async deleteMessage(id: string): Promise<any> {
    return this.messageModel.findByIdAndDelete(id).exec();
  }

  async deleteAllMessages(roomId: string): Promise<any> {
    return this.messageModel.deleteMany({ roomId }).exec();
  }
}