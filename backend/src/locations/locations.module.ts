import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [CacheModule.register()],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}