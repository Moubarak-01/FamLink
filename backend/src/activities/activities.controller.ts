import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createActivityDto: any) {
    return this.activitiesService.create(createActivityDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.activitiesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/join')
  join(@Request() req, @Param('id') id: string) {
    return this.activitiesService.join(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/request/:userId/approve')
  approveRequest(@Param('id') id: string, @Param('userId') userId: string, @Request() req) {
    return this.activitiesService.approveRequest(id, userId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/request/:userId/decline')
  declineRequest(@Param('id') id: string, @Param('userId') userId: string, @Request() req) {
    return this.activitiesService.declineRequest(id, userId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activitiesService.delete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  removeAll() {
    return this.activitiesService.deleteAll();
  }
}