import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createTaskDto: any) {
    return this.marketplaceService.create(createTaskDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.marketplaceService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/offers')
  makeOffer(@Request() req, @Param('id') id: string, @Body() offerDto: any) {
      return this.marketplaceService.makeOffer(id, offerDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/offers/:helperId')
  updateOfferStatus(@Param('id') id: string, @Param('helperId') helperId: string, @Body('status') status: string) {
      return this.marketplaceService.updateOfferStatus(id, helperId, status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
      return this.marketplaceService.delete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  removeAll() {
      return this.marketplaceService.deleteAll();
  }
}