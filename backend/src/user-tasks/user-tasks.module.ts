
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserTasksController } from './user-tasks.controller';
import { UserTasksService } from './user-tasks.service';
import { UserTask, UserTaskSchema } from '../schemas/user-task.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserTask.name, schema: UserTaskSchema }])],
  controllers: [UserTasksController],
  providers: [UserTasksService],
})
export class UserTasksModule {}
