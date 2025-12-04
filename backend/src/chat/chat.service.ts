import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { BookingDocument } from '../schemas/booking.schema';
import { SkillTaskDocument } from '../schemas/task.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel('Booking') private bookingModel: Model<BookingDocument>,
    @InjectModel('SkillTask') private skillTaskModel: Model<SkillTaskDocument>,
  ) {}

  async saveMessage(roomId: string, senderId: string, text: string): Promise<MessageDocument> {
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

    const message = new this.messageModel({ roomId, senderId, receiverId, text, status: 'sent' });
    return message.save();
  }

  async getMessages(roomId: string): Promise<MessageDocument[]> {
    return this.messageModel.find({ roomId })
      .populate('senderId', 'fullName photo')
      .sort({ createdAt: 1 })
      .exec();
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

  async deleteMessage(id: string) { return this.messageModel.findByIdAndDelete(id).exec(); }
  async deleteAllMessages(roomId: string) { return this.messageModel.deleteMany({ roomId }).exec(); }
}