
import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { OutingsService } from './outings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('outings')
export class OutingsController {
  constructor(private readonly outingsService: OutingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createOutingDto: any) {
    return this.outingsService.create(createOutingDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.outingsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/request')
  requestJoin(@Request() req, @Param('id') id: string, @Body() requestDto: any) {
      return this.outingsService.requestJoin(id, requestDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/requests/:parentId')
  updateRequestStatus(@Param('id') id: string, @Param('parentId') parentId: string, @Body('status') status: string) {
      return this.outingsService.updateRequestStatus(id, parentId, status);
  }
}
