
import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createReviewDto: { targetId: string; rating: number; comment: string }) {
    return this.reviewsService.create(req.user.userId, createReviewDto.targetId, createReviewDto.rating, createReviewDto.comment);
  }

  @Get(':userId')
  findAll(@Param('userId') userId: string) {
    return this.reviewsService.findAllForUser(userId);
  }
}
