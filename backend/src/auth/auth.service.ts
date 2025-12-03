
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

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
    const newUser = await this.usersService.create(userDto);
    return this.login(newUser.toObject());
  }
}
