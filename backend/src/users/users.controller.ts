
import { Controller, Get, Body, Patch, UseGuards, Request, Param, Post, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findOneById(req.user.userId);
    // Exclude passwordHash
    const { passwordHash, ...result } = user.toObject();
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateData: any) {
    return this.usersService.updateProfile(req.user.userId, updateData);
  }

  // Get all nannies (public or protected based on preference, protecting for now)
  @Get('nannies')
  async getNannies() {
    const nannies = await this.usersService.getNannies();
    return nannies.map(n => {
      const { passwordHash, ...result } = n.toObject();
      return result;
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('nannies/:id/add')
  async addNanny(@Request() req, @Param('id') nannyId: string) {
    return this.usersService.addNannyToDashboard(req.user.userId, nannyId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('nannies/:id/remove')
  async removeNanny(@Request() req, @Param('id') nannyId: string) {
    return this.usersService.removeNannyFromDashboard(req.user.userId, nannyId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  async deleteProfile(@Request() req) {
    return this.usersService.deleteUser(req.user.userId);
  }
}
