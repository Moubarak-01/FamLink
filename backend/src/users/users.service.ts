
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async create(createUserDto: any): Promise<UserDocument> {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    const createdUser = new this.userModel({
      ...createUserDto,
      passwordHash,
    });
    return createdUser.save();
  }

  async findOneByEmail(email: string): Promise<UserDocument | undefined> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOneById(id: string): Promise<UserDocument | undefined> {
    return this.userModel.findById(id).exec();
  }

  async updateProfile(userId: string, updateData: any): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async addNannyToDashboard(parentId: string, nannyId: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      parentId,
      { $addToSet: { addedNannyIds: nannyId } },
      { new: true }
    ).exec();
  }

  async removeNannyFromDashboard(parentId: string, nannyId: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      parentId,
      { $pull: { addedNannyIds: nannyId } },
      { new: true }
    ).exec();
  }

  async getNannies(): Promise<UserDocument[]> {
    return this.userModel.find({ userType: 'nanny' }).exec();
  }

  async deleteUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndDelete(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByVerificationToken(token: string): Promise<UserDocument | undefined> {
    return this.userModel.findOne({ verificationToken: token }).exec();
  }

  async markEmailAsVerified(userId: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { isVerified: true, verificationToken: null },
      { new: true }
    ).exec();
  }

  async updateFcmToken(userId: string, token: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(userId, { fcmToken: token }, { new: true }).exec();
  }

  async updateGoogleToken(userId: string, refreshToken: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { googleRefreshToken: refreshToken, isGoogleCalendarConnected: true },
      { new: true }
    ).exec();
  }

  // Alias for generic usage
  async findById(id: string): Promise<UserDocument | undefined> {
    return this.findOneById(id);
  }
}
