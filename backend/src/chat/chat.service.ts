import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { BookingDocument } from '../schemas/booking.schema';
import { SkillTaskDocument } from '../schemas/task.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { OutingDocument } from '../schemas/outing.schema';
import { ActivityDocument } from '../schemas/activity.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel('Booking') private bookingModel: Model<BookingDocument>,
    @InjectModel('SkillTask') private skillTaskModel: Model<SkillTaskDocument>,
    @InjectModel('Outing') private outingModel: Model<OutingDocument>,
    @InjectModel('Activity') private activityModel: Model<ActivityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  async saveMessage(roomId: string, senderId: string, text: string, mac: string, replyTo?: string): Promise<MessageDocument> {
    let receiverId = null;

    // DEBUG: Log incoming values
    console.log(`📩 [saveMessage] roomId: ${roomId}, senderId: ${senderId}`);

    const booking = await this.bookingModel.findById(roomId).exec();
    if (booking) {
      const parentIdStr = booking.parentId.toString();
      const nannyIdStr = booking.nannyId.toString();
      const senderIdStr = senderId.toString();

      // DEBUG: Log comparison values
      console.log(`📊 [Booking] parentIdStr: "${parentIdStr}", nannyIdStr: "${nannyIdStr}", senderIdStr: "${senderIdStr}"`);
      console.log(`📊 [Booking] Is sender Parent? ${parentIdStr === senderIdStr}`);

      receiverId = parentIdStr === senderIdStr ? nannyIdStr : parentIdStr;
      console.log(`📊 [Booking] Calculated receiverId: "${receiverId}"`);
    } else {
      const skill = await this.skillTaskModel.findById(roomId).exec();
      if (skill) {
        const requesterIdStr = skill.requesterId.toString();
        const senderIdStr = senderId.toString();

        // DEBUG: For Skills (Parent-to-Parent)
        console.log(`📊 [SkillTask] requesterId: "${requesterIdStr}", senderId: "${senderIdStr}"`);

        // FIX: For skill tasks, if sender is requester, we need to find the OTHER participant
        if (senderIdStr === requesterIdStr) {
          const acceptedOffer = skill.offers.find(o => o.status === 'accepted');
          if (acceptedOffer) {
            receiverId = acceptedOffer.helperId.toString();
          } else {
            console.log(`📊 [SkillTask] No accepted offer found.`);
          }
        } else {
          receiverId = requesterIdStr;
        }
        console.log(`📊 [SkillTask] Calculated receiverId: "${receiverId}"`);
      } else {
        // Check Outing
        const outing = await this.outingModel.findById(roomId).exec();
        if (outing) {
          const hostIdStr = outing.hostId.toString();
          const senderIdStr = senderId.toString();

          if (senderIdStr === hostIdStr) {
            const acceptedReq = outing.requests.find(r => r.status === 'accepted');
            if (acceptedReq) {
              receiverId = acceptedReq.parentId.toString();
            }
          } else {
            receiverId = hostIdStr;
          }
          console.log(`📊 [Outing] Calculated receiverId: "${receiverId}"`);
        } else {
          // Check Activity
          const activity = await this.activityModel.findById(roomId).exec();
          if (activity) {
            const hostIdStr = activity.hostId.toString();
            const senderIdStr = senderId.toString();

            if (senderIdStr === hostIdStr) {
              // Activity participants are array of IDs. 
              // FIX: Find the participant that is NOT the host (sender)
              // This assumes 1-on-1 chat behavior for now.
              const other = activity.participants.find(p => p.toString() !== senderIdStr);
              if (other) {
                receiverId = other.toString();
              }
            } else {
              // Sender is Participant. Target is Host.
              receiverId = hostIdStr;
            }
            console.log(`📊 [Activity] Calculated receiverId: "${receiverId}"`);
          } else {
            console.log(`⚠️ [saveMessage] Room ${roomId} not found in Bookings, Skills, Outings, or Activities`);
          }
        }
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

  // NEW: Mark single message as delivered (for real-time updates)
  async markMessageAsDelivered(messageId: string): Promise<MessageDocument | null> {
    return this.messageModel.findByIdAndUpdate(
      messageId,
      { status: 'delivered', deliveredAt: new Date() },
      { new: true }
    ).exec();
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