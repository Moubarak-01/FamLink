import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ActivitiesModule } from './activities/activities.module';
import { OutingsModule } from './outings/outings.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { BookingsModule } from './bookings/bookings.module';
import { ChatModule } from './chat/chat.module';
import { PaymentModule } from './payment/payment.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UserTasksModule } from './user-tasks/user-tasks.module';
import { LocationsModule } from './locations/locations.module';
import { TelemetryModule } from './telemetry/telemetry.module';

@Module({
  imports: [
    // Load env vars from .env or .env.local in root or backend folder
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '../.env', '../.env.local'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI') || 'mongodb://localhost:27017/famlink',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ActivitiesModule,
    OutingsModule,
    MarketplaceModule,
    BookingsModule,
    ChatModule,
    PaymentModule,
    NotificationsModule,
    ReviewsModule,
    UserTasksModule,
    LocationsModule,
    TelemetryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }