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
  handleJoinRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.join(roomId);
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
    };

    client.to(data.roomId).emit('receive_message', {
      roomId: data.roomId,
      message: messagePayload,
    });

    // Trigger notification logic
    this.sendChatNotification(data.roomId, data.message.senderId, sender.fullName, data.message.text);

    return messagePayload;
  }

  private async sendChatNotification(roomId: string, senderId: string, senderName: string, text: string) {
      try {
          // Validate ID format to prevent crashes
          if (!Types.ObjectId.isValid(roomId)) return;

          const notificationMsg = `New message from ${senderName}`;
          let recipients: string[] = [];

          // Try Booking (Direct Chat)
          const booking = await this.bookingModel.findById(roomId).exec();
          if (booking) {
              if (booking.parentId.toString() !== senderId) recipients.push(booking.parentId.toString());
              if (booking.nannyId.toString() !== senderId) recipients.push(booking.nannyId.toString());
          } else {
              // Try Activity (Group Chat)
              const activity = await this.activityModel.findById(roomId).exec();
              if (activity) {
                  recipients = activity.participants.map(p => p.toString()).filter(id => id !== senderId);
              } else {
                  // Try Outing (Group Chat)
                  const outing = await this.outingModel.findById(roomId).exec();
                  if (outing) {
                      if (outing.hostId.toString() !== senderId) recipients.push(outing.hostId.toString());
                      outing.requests.forEach(req => {
                          if (req.status === 'accepted' && req.parentId.toString() !== senderId) {
                              recipients.push(req.parentId.toString());
                          }
                      });
                  } else {
                      // Try Skill (Task Chat)
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