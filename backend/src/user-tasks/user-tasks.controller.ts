import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { UserTasksService } from './user-tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user-tasks')
export class UserTasksController {
  constructor(private readonly userTasksService: UserTasksService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createTaskDto: any) {
    return this.userTasksService.create(createTaskDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.userTasksService.findAllForUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.userTasksService.updateStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/keep')
  keepPermanently(@Param('id') id: string) {
      return this.userTasksService.keepTaskPermanently(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
      return this.userTasksService.remove(id);
  }
}