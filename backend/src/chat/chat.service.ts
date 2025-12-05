import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { BookingDocument } from '../schemas/booking.schema';
import { SkillTaskDocument } from '../schemas/task.schema';
import { User, UserDocument } from '../schemas/user.schema'; // Import User

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel('Booking') private bookingModel: Model<BookingDocument>,
    @InjectModel('SkillTask') private skillTaskModel: Model<SkillTaskDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>, // Inject User Model
  ) {}

  async saveMessage(roomId: string, senderId: string, text: string, mac: string, replyTo?: string): Promise<MessageDocument> {
    let receiverId = null;
    const booking = await this.bookingModel.findById(roomId).exec();
    if (booking) {
        const parentIdStr = booking.parentId.toString();
        const nannyIdStr = booking.nannyId.toString();
        receiverId = parentIdStr === senderId ? nannyIdStr : parentIdStr;
    } else {
         const skill = await this.skillTaskModel.findById(roomId).exec();
         if (skill) {
             const requesterIdStr = skill.requesterId.toString();
             receiverId = requesterIdStr === senderId ? null : requesterIdStr; 
         }
    }

    const message = new this.messageModel({ 
        roomId, 
        senderId, 
        receiverId, 
        text, 
        mac, 
        replyTo: replyTo || null,
        status: 'sent',
        deletedFor: [] // Initialize array
    });
    return message.save();
  }

  async getMessages(roomId: string): Promise<MessageDocument[]> {
    return this.messageModel.find({ roomId })
      .populate('senderId', 'fullName photo')
      .sort({ createdAt: 1 })
      .exec();
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');
    
    const exists = message.reactions.find(r => r.userId === userId && r.emoji === emoji);
    if (!exists) {
        message.reactions.push({ userId, emoji });
        return message.save();
    }
    return message;
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<MessageDocument> {
    return this.messageModel.findByIdAndUpdate(
        messageId,
        { $pull: { reactions: { userId, emoji } } },
        { new: true }
    ).exec();
  }

  // UPDATED: Handle "Delete for Me" vs "Delete for Everyone"
  async deleteMessage(messageId: string, userId: string, forEveryone: boolean): Promise<MessageDocument> {
    if (forEveryone) {
        return this.messageModel.findByIdAndUpdate(
            messageId,
            { 
                deleted: true, 
                deletedAt: new Date(),
                text: '', 
                mac: ''
            },
            { new: true }
        ).exec();
    } else {
        return this.messageModel.findByIdAndUpdate(
            messageId,
            { $addToSet: { deletedFor: userId } },
            { new: true }
        ).exec();
    }
  }

  async markUndeliveredMessagesAsDelivered(userId: string): Promise<MessageDocument[]> {
    const userObjectId = new Types.ObjectId(userId);
    await this.messageModel.updateMany(
      { receiverId: userObjectId, status: 'sent' },
      { status: 'delivered', deliveredAt: new Date() }
    ).exec();
    return this.messageModel.find({ receiverId: userObjectId, status: 'delivered' }).exec();
  }

  async markMessagesAsSeen(roomId: string, viewerId: string): Promise<string[]> {
    const viewerObjectId = new Types.ObjectId(viewerId);
    
    const messagesToUpdate = await this.messageModel.find({ 
        roomId, 
        receiverId: viewerObjectId, 
        status: { $ne: 'seen' } 
    });

    if (messagesToUpdate.length > 0) {
        await this.messageModel.updateMany(
            { roomId, receiverId: viewerObjectId, status: { $ne: 'seen' } },
            { status: 'seen', seenAt: new Date() }
        ).exec();
    }
    
    return messagesToUpdate.map(m => m._id.toString());
  }

  async deleteAllMessages(roomId: string) { return this.messageModel.deleteMany({ roomId }).exec(); }

  // NEW: Update User Status
  async updateUserStatus(userId: string, status: 'online' | 'offline'): Promise<UserDocument> {
      const updateData: any = { status };
      if (status === 'offline') {
          updateData.lastSeen = new Date();
      }
      return this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
  }

  // NEW: Get User Status for initial load
  async getUserStatus(userId: string): Promise<{ status: string, lastSeen: Date }> {
      const user = await this.userModel.findById(userId, 'status lastSeen').exec();
      return user ? { status: user.status, lastSeen: user.lastSeen } : { status: 'offline', lastSeen: null };
  }
}