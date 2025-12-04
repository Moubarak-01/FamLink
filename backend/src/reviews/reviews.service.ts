import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async create(reviewerId: string, targetId: string, rating: number, comment: string): Promise<ReviewDocument> {
    const review = new this.reviewModel({
      reviewerId,
      targetId,
      rating,
      comment,
    });
    const savedReview = await review.save();

    // Feature 3: Update the target user's average rating immediately
    await this.updateUserRating(targetId);

    return savedReview;
  }

  async findAllForUser(targetId: string): Promise<ReviewDocument[]> {
    return this.reviewModel.find({ targetId }).populate('reviewerId', 'fullName photo').exec();
  }

  private async updateUserRating(userId: string) {
    const reviews = await this.reviewModel.find({ targetId: userId });
    if (reviews.length === 0) return;

    const total = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    // Round to 1 decimal place
    const average = Math.round((total / reviews.length) * 10) / 10;

    await this.userModel.findByIdAndUpdate(userId, { 
        'profile.rating': average 
    });
  }
}