// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../schemas/booking.schema';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let model: Model<BookingDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getModelToken(Booking.name),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
          },
        },
        {
          provide: 'NotificationsService',
          useValue: {},
        },
        {
          provide: 'ChatGateway',
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    model = module.get<Model<BookingDocument>>(getModelToken(Booking.name));
  });

  it('should normalize the date on booking creation', async () => {
    const input = { date: '2023-11-20T10:00:00' };
    const parentId = 'parent123';
    const result = await service.create(input, parentId);
    expect(result.date).toBe(new Date(input.date).toISOString());
  });

  it('should throw error with invalid date', async () => {
    const input = { date: 'invalid-date' };
    const parentId = 'parent123';
    await expect(service.create(input, parentId)).rejects.toThrow();
  });
});
