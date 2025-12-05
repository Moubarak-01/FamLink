import { Controller, Get, Param, UseGuards, Delete, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':roomId')
  async getMessages(@Param('roomId') roomId: string) {
    return this.chatService.getMessages(roomId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('message/:id')
  async deleteMessage(@Param('id') id: string, @Request() req) {
      // Fix: Pass userId and default 'forEveryone' to true for REST API calls
      return this.chatService.deleteMessage(id, req.user.userId, true);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('room/:roomId')
  async deleteAllMessages(@Param('roomId') roomId: string) {
      return this.chatService.deleteAllMessages(roomId);
  }
}