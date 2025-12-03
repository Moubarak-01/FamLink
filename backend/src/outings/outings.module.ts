
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OutingsController } from './outings.controller';
import { OutingsService } from './outings.service';
import { Outing, OutingSchema } from '../schemas/outing.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Outing.name, schema: OutingSchema }])],
  controllers: [OutingsController],
  providers: [OutingsService],
})
export class OutingsModule {}
