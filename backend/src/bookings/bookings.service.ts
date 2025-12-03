import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../schemas/booking.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../schemas/user.schema';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private notificationsService: NotificationsService
  ) {}

  async create(createBookingDto: any, parentId: string): Promise<BookingDocument> {
    const booking = new this.bookingModel({
      ...createBookingDto,
      parentId: parentId,
    });
    const savedBooking = await booking.save();

    // Format date for the notification message
    const bookingDate = new Date(createBookingDto.date).toLocaleDateString();

    // Create a notification for the nanny
    await this.notificationsService.create(
      createBookingDto.nannyId,
      `New booking request for ${bookingDate}`,
      'booking',
      savedBooking._id.toString()
    );

    return savedBooking;
  }

  async findAllForUser(userId: string): Promise<BookingDocument[]> {
    return this.bookingModel.find({
        $or: [{ parentId: userId }, { nannyId: userId }]
    }).exec();
  }

  async updateStatus(bookingId: string, status: string): Promise<BookingDocument> {
      const originalBooking = await this.bookingModel.findById(bookingId)
        .populate<{nannyId: User}>('nannyId')
        .exec();

      if (originalBooking && status === 'accepted') {
           const nannyName = originalBooking.nannyId.fullName || 'The Nanny';
           await this.notificationsService.create(
               originalBooking.parentId,
               `${nannyName} accepted your booking request!`,
               'booking',
               originalBooking._id.toString()
           );
      }

      return this.bookingModel.findByIdAndUpdate(
          bookingId,
          { status },
          { new: true }
      ).exec();
  }

  async remove(id: string): Promise<any> {
    return this.bookingModel.findByIdAndDelete(id).exec();
  }

  async removeAll(): Promise<any> {
    return this.bookingModel.deleteMany({}).exec();
  }
}