import { Controller, Get, Param, UseGuards, Delete } from '@nestjs/common';
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
  async deleteMessage(@Param('id') id: string) {
      return this.chatService.deleteMessage(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('room/:roomId')
  async deleteAllMessages(@Param('roomId') roomId: string) {
      return this.chatService.deleteAllMessages(roomId);
  }
}