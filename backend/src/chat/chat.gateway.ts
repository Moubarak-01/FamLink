import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BookingDocument } from '../schemas/booking.schema';
import { ActivityDocument } from '../schemas/activity.schema';
import { OutingDocument } from '../schemas/outing.schema';
import { SkillTaskDocument } from '../schemas/task.schema';
import { NotificationsService } from '../notifications/notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly notificationsService: NotificationsService,
    @InjectModel('Booking') private bookingModel: Model<BookingDocument>,
    @InjectModel('Activity') private activityModel: Model<ActivityDocument>,
    @InjectModel('Outing') private outingModel: Model<OutingDocument>,
    @InjectModel('SkillTask') private skillTaskModel: Model<SkillTaskDocument>,
  ) {}

  @SubscribeMessage('join_room')
  async handleJoinRoom(@MessageBody() data: { roomId: string, userId?: string }, @ConnectedSocket() client: Socket) {
    // Support both string and object payload for backward compatibility
    const roomId = typeof data === 'string' ? data : data.roomId;
    const userId = typeof data === 'object' ? data.userId : null;

    client.join(roomId);

    // Feature 6: Mark messages as seen when user joins
    if (userId) {
       await this.chatService.markMessagesAsSeen(roomId, userId);
       // Broadcast to everyone in room that messages are seen
       this.server.to(roomId).emit('messages_seen', { roomId, seenBy: userId });
    }
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.leave(roomId);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { roomId: string; message: { senderId: string; text: string } },
    @ConnectedSocket() client: Socket,
  ) {
    const savedMessage = await this.chatService.saveMessage(
      data.roomId,
      data.message.senderId,
      data.message.text,
    );

    await savedMessage.populate('senderId', 'fullName photo');
    
    const sender: any = savedMessage.senderId;
    const messagePayload = {
      id: savedMessage._id.toString(),
      text: savedMessage.text,
      senderId: sender._id.toString(),
      senderName: sender.fullName,
      senderPhoto: sender.photo,
      timestamp: savedMessage['createdAt'],
      status: 'sent' // Initial status
    };

    client.to(data.roomId).emit('receive_message', {
      roomId: data.roomId,
      message: messagePayload,
    });

    this.sendChatNotification(data.roomId, data.message.senderId, sender.fullName, data.message.text);

    return messagePayload;
  }

  private async sendChatNotification(roomId: string, senderId: string, senderName: string, text: string) {
      try {
          if (!Types.ObjectId.isValid(roomId)) return;

          const notificationMsg = `New message from ${senderName}`;
          let recipients: string[] = [];

          const booking = await this.bookingModel.findById(roomId).exec();
          if (booking) {
              if (booking.parentId.toString() !== senderId) recipients.push(booking.parentId.toString());
              if (booking.nannyId.toString() !== senderId) recipients.push(booking.nannyId.toString());
          } else {
              const activity = await this.activityModel.findById(roomId).exec();
              if (activity) {
                  recipients = activity.participants.map(p => p.toString()).filter(id => id !== senderId);
              } else {
                  const outing = await this.outingModel.findById(roomId).exec();
                  if (outing) {
                      if (outing.hostId.toString() !== senderId) recipients.push(outing.hostId.toString());
                      outing.requests.forEach(req => {
                          if (req.status === 'accepted' && req.parentId.toString() !== senderId) {
                              recipients.push(req.parentId.toString());
                          }
                      });
                  } else {
                      const skill = await this.skillTaskModel.findById(roomId).exec();
                      if (skill) {
                           if (skill.requesterId.toString() !== senderId) recipients.push(skill.requesterId.toString());
                           skill.offers.forEach(offer => {
                               if (offer.status === 'accepted' && offer.helperId.toString() !== senderId) {
                                   recipients.push(offer.helperId.toString());
                               }
                           });
                      }
                  }
              }
          }

          const uniqueRecipients = [...new Set(recipients)];
          for (const userId of uniqueRecipients) {
              await this.notificationsService.create(userId, notificationMsg, 'chat', roomId);
          }

      } catch (e) {
          console.error("Error sending chat notification:", e);
      }
  }
}