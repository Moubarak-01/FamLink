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
    const roomId = typeof data === 'string' ? data : data.roomId;
    const userId = typeof data === 'object' ? data.userId : null;

    client.join(roomId);
    console.log(`Client ${client.id} joined room ${roomId}`);

    // Feature 2: Mark messages as seen when user joins
    if (userId) {
       await this.chatService.markMessagesAsSeen(roomId, userId);
       // Broadcast to everyone in room that messages are seen
       this.server.to(roomId).emit('messages_status_update', { roomId, status: 'seen', userId });
    }
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.leave(roomId);
  }

  // Feature 2: Handle "Delivered" receipt
  @SubscribeMessage('mark_delivered')
  async handleMarkDelivered(@MessageBody() data: { roomId: string, messageId: string, userId: string }) {
      // In a real app, update specific message in DB. For simplicity, we rely on frontend logic mostly.
      // This tells the sender "The other person's device received it"
      this.server.to(data.roomId).emit('message_status_update', { 
          messageId: data.messageId, 
          status: 'delivered' 
      });
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { roomId: string; message: { senderId: string; text: string } },
    @ConnectedSocket() client: Socket,
  ) {
    // Feature 3: Chat Permission Check (Booking Required)
    // If this is a booking room, ensure booking is accepted
    if (data.roomId) {
        // Check if roomId corresponds to a Booking
        const booking = await this.bookingModel.findById(data.roomId).exec();
        if (booking) {
            if (booking.status !== 'accepted') {
                // Reject message
                client.emit('error', { message: 'Chat disabled. Booking must be accepted first.' });
                return;
            }
        }
    }

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
      status: 'sent'
    };

    // Broadcast to room (excluding sender)
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