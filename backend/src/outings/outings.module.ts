
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OutingsController } from './outings.controller';
import { OutingsService } from './outings.service';
import { Outing, OutingSchema } from '../schemas/outing.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Outing.name, schema: OutingSchema }]),
    MongooseModule.forFeature([{ name: Outing.name, schema: OutingSchema }]),
    NotificationsModule,
    ChatModule // Added ChatModule so EventGateway is available (via ChatGateway export related modules)
  ],
  controllers: [OutingsController],
  providers: [OutingsService],
})
export class OutingsModule { }
