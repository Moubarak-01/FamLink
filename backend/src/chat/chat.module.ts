import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { CallLogController } from './call-log.controller';
import { CallLogService } from './call-log.service';
import { AuthModule } from '../auth/auth.module'; // <-- Add Import
import { Message, MessageSchema } from '../schemas/message.schema';
import { CallLog, CallLogSchema } from '../schemas/call-log.schema';
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
      { name: CallLog.name, schema: CallLogSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Outing.name, schema: OutingSchema },
      { name: SkillTask.name, schema: SkillTaskSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule
  ],
  controllers: [ChatController, CallLogController],
  providers: [ChatGateway, ChatService, CallLogService],
  exports: [ChatGateway, CallLogService],
})
export class ChatModule { }
