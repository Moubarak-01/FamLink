
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { SkillTask, SkillTaskSchema } from '../schemas/task.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SkillTask.name, schema: SkillTaskSchema }])],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
})
export class MarketplaceModule {}
