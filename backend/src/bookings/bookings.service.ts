import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../schemas/booking.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../schemas/user.schema';
import { ChatGateway } from '../chat/chat.gateway';
import { CalendarService } from '../calendar/calendar.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private notificationsService: NotificationsService,
    private chatGateway: ChatGateway,
    private calendarService: CalendarService
  ) { }

  // Helper to flatten the Mongoose object for the frontend
  private mapBooking(booking: any) {
    if (!booking) return null;
    const obj = booking.toObject ? booking.toObject() : booking;

    // Handle populated fields safely with robust null checks
    const nanny = (obj.nannyId && typeof obj.nannyId === 'object') ? obj.nannyId : { _id: obj.nannyId || 'unknown', fullName: 'Unknown Nanny', photo: '' };
    const parent = (obj.parentId && typeof obj.parentId === 'object') ? obj.parentId : { _id: obj.parentId || 'unknown', fullName: 'Unknown Parent', photo: '' };

    return {
      ...obj,
      id: obj._id ? obj._id.toString() : 'unknown',
      // Flattened fields expected by frontend types
      nannyId: nanny._id ? nanny._id.toString() : 'unknown',
      nannyName: nanny.fullName || 'Unknown',
      nannyPhoto: nanny.photo || '',
      parentId: parent._id ? parent._id.toString() : 'unknown',
      parentName: parent.fullName || 'Unknown',
      parentPhoto: parent.photo || '',
    };
  }

  async create(createBookingDto: any, parentId: string): Promise<any> {
    // 1. Check for Duplicate Requests (Accepted, Pending, OR Declined)
    const existingBooking = await this.bookingModel.findOne({
      nannyId: createBookingDto.nannyId,
      parentId: parentId,
      date: createBookingDto.date,
      status: { $in: ['accepted', 'pending', 'declined'] }
    }).exec();

    if (existingBooking) {
      if (existingBooking.status === 'accepted') {
        throw new BadRequestException('You already have a confirmed booking with this nanny for this date.');
      } else if (existingBooking.status === 'pending') {
        throw new BadRequestException('You already have a pending request for this date.');
      } else if (existingBooking.status === 'declined') {
        throw new BadRequestException('This request was previously declined for this date. You cannot re-apply.');
      }
    }

    // 3. Create Booking
    const booking = new this.bookingModel({
      ...createBookingDto,
      parentId: parentId,
    });
    const savedBooking = await booking.save();

    // 4. Populate immediately for the return value
    await savedBooking.populate([
      { path: 'nannyId', select: 'fullName photo' },
      { path: 'parentId', select: 'fullName photo' }
    ]);

    // 5. Send Notification
    const bookingDate = new Date(createBookingDto.date).toLocaleDateString();
    await this.notificationsService.create(
      createBookingDto.nannyId,
      `New booking request from ${savedBooking['parentId']['fullName']} for ${bookingDate}`,
      'booking',
      savedBooking._id.toString(),
      {
        parentName: savedBooking['parentId']['fullName'],
        date: bookingDate
      }
    );

    this.chatGateway.server.emit('bookings_update', { action: 'create', bookingId: savedBooking._id });
    return this.mapBooking(savedBooking);
  }

  async findAllForUser(userId: string): Promise<any[]> {
    const bookings = await this.bookingModel.find({
      $or: [{ parentId: userId }, { nannyId: userId }]
    })
      .populate('nannyId', 'fullName photo')
      .populate('parentId', 'fullName photo')
      .sort({ createdAt: -1 })
      .exec();

    return bookings.map(b => this.mapBooking(b));
  }

  async updateStatus(bookingId: string, status: string): Promise<any> {
    const originalBooking = await this.bookingModel.findById(bookingId)
      .populate('nannyId', 'fullName')
      .exec();

    if (!originalBooking) throw new NotFoundException('Booking not found');

    const updatedBooking = await this.bookingModel.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    )
      .populate('nannyId', 'fullName photo')
      .populate('parentId', 'fullName photo')
      .exec();

    if (status === 'accepted' || status === 'declined') {
      const nannyName = originalBooking['nannyId']['fullName'] || 'The Nanny';
      const type = status === 'accepted' ? 'booking_accepted' : 'booking_declined';
      // 1. Send Notification
      await this.notificationsService.create(
        originalBooking.parentId.toString(),
        `${nannyName} ${status} your booking request!`,
        type,
        originalBooking._id.toString(),
        { nannyName }
      );

      // 2. Sync to Calendar if accepted
      if (status === 'accepted') {
        const nannyId = (originalBooking.nannyId as any)._id || originalBooking.nannyId;
        const parentId = (originalBooking.parentId as any)._id || originalBooking.parentId;
        // Try to add to both users' calendars (if connected)
        await this.calendarService.createEvent(nannyId.toString(), updatedBooking);
        await this.calendarService.createEvent(parentId.toString(), updatedBooking);
      }
    }

    this.chatGateway.server.emit('bookings_update', { action: 'update_status', bookingId });
    return this.mapBooking(updatedBooking);
  }

  async remove(id: string, userId: string): Promise<any> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) throw new NotFoundException('Booking not found');

    const nannyId = (booking.nannyId as any)._id ? (booking.nannyId as any)._id.toString() : booking.nannyId.toString();
    const parentId = (booking.parentId as any)._id ? (booking.parentId as any)._id.toString() : booking.parentId.toString();

    if (parentId !== userId && nannyId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this booking.');
    }

    const res = await this.bookingModel.findByIdAndDelete(id).exec();
    this.chatGateway.server.emit('bookings_update', { action: 'delete', id });
    return res;
  }

  async removeAll(): Promise<any> {
    return this.bookingModel.deleteMany({}).exec();
  }
}