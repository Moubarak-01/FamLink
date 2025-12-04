import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Outing, OutingDocument } from '../schemas/outing.schema';

@Injectable()
export class OutingsService {
  constructor(@InjectModel(Outing.name) private outingModel: Model<OutingDocument>) {}

  async create(createOutingDto: any, userId: string): Promise<OutingDocument> {
    const createdOuting = new this.outingModel({
      ...createOutingDto,
      hostId: userId,
    });
    return createdOuting.save();
  }

  async findAll(): Promise<OutingDocument[]> {
    return this.outingModel.find()
      .populate('hostId', 'fullName photo isVerified')
      .sort({ createdAt: -1 })
      .exec();
  }

  async requestJoin(outingId: string, requestDto: any, userId: string): Promise<OutingDocument> {
      const request = { ...requestDto, parentId: userId, status: 'pending' };
      return this.outingModel.findByIdAndUpdate(
          outingId,
          { $push: { requests: request } },
          { new: true }
      ).exec();
  }

  async updateRequestStatus(outingId: string, parentId: string, status: string): Promise<OutingDocument> {
       return this.outingModel.findOneAndUpdate(
           { _id: outingId, "requests.parentId": parentId },
           { $set: { "requests.$.status": status } },
           { new: true }
       ).exec();
  }

  async delete(id: string): Promise<any> {
      return this.outingModel.findByIdAndDelete(id).exec();
  }

  async deleteAll(): Promise<any> {
      return this.outingModel.deleteMany({}).exec();
  }
}