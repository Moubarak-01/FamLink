
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id, userType: user.userType };
    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

  async register(userDto: any) {
    // Check if user exists
    const existing = await this.usersService.findOneByEmail(userDto.email);
    if (existing) {
      throw new UnauthorizedException('Email already exists');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user with verification token and isEmailVerified=false
    const newUser = await this.usersService.create({
      ...userDto,
      verificationToken,
      isVerified: false
    });

    // Send verification email
    await this.mailService.sendVerificationEmail(newUser.email, verificationToken);

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (user.isVerified) {
      return { message: 'Email already verified' };
    }

    await this.usersService.markEmailAsVerified(user._id.toString());
    return { message: 'Email verified successfully' };
  }
}
