import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Message.name) private messageModel: Model<MessageDocument>) {}

  async saveMessage(roomId: string, senderId: string, text: string): Promise<MessageDocument> {
    const message = new this.messageModel({
      roomId,
      senderId,
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

  // Feature 6: Mark messages as seen
  async markMessagesAsSeen(roomId: string, userId: string): Promise<void> {
    // Update messages in this room that were NOT sent by the current user
    await this.messageModel.updateMany(
        { roomId, senderId: { $ne: userId }, status: { $ne: 'seen' } },
        { status: 'seen' }
    ).exec();
  }

  async deleteMessage(id: string): Promise<any> {
    return this.messageModel.findByIdAndDelete(id).exec();
  }

  async deleteAllMessages(roomId: string): Promise<any> {
    return this.messageModel.deleteMany({ roomId }).exec();
  }
}