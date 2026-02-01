import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserTasksController } from './user-tasks.controller';
import { UserTasksService } from './user-tasks.service';
import { UserTask, UserTaskSchema } from '../schemas/user-task.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserTask.name, schema: UserTaskSchema }]),
    NotificationsModule,
    ChatModule,
  ],
  controllers: [UserTasksController],
  providers: [UserTasksService],
})
export class UserTasksModule { }