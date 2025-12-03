
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../schemas/booking.schema';

@Injectable()
export class BookingsService {
  constructor(@InjectModel(Booking.name) private bookingModel: Model<BookingDocument>) {}

  async create(createBookingDto: any, parentId: string): Promise<BookingDocument> {
    const booking = new this.bookingModel({
      ...createBookingDto,
      parentId: parentId,
    });
    return booking.save();
  }

  async findAllForUser(userId: string): Promise<BookingDocument[]> {
    // Find bookings where user is either parent or nanny
    return this.bookingModel.find({
        $or: [{ parentId: userId }, { nannyId: userId }]
    })
    .populate('parentId', 'fullName photo')
    .populate('nannyId', 'fullName photo')
    .exec();
  }

  async updateStatus(bookingId: string, status: string): Promise<BookingDocument> {
      return this.bookingModel.findByIdAndUpdate(
          bookingId,
          { status },
          { new: true }
      ).exec();
  }
}
