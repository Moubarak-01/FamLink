import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AuthModule } from '../auth/auth.module'; // <-- Add Import
import { Message, MessageSchema } from '../schemas/message.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { Booking, BookingSchema } from '../schemas/booking.schema';
import { Activity, ActivitySchema } from '../schemas/activity.schema';
import { Outing, OutingSchema } from '../schemas/outing.schema';
import { SkillTask, SkillTaskSchema } from '../schemas/task.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    AuthModule, // <-- Import AuthModule to use JwtService
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Outing.name, schema: OutingSchema },
      { name: SkillTask.name, schema: SkillTaskSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatGateway],
})
export class ChatModule { }
