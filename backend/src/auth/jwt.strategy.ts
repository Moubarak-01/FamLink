
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          return request?.cookies?.jwt;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
    if (!configService.get<string>('JWT_SECRET')) {
      throw new Error('JWT_SECRET environment variable is not defined!');
    }
  }

  async validate(payload: any) {
    // payload contains { sub: userId, email: userEmail, userType: ... }
    return { userId: payload.sub, email: payload.email, userType: payload.userType };
  }
}
