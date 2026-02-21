
import { Controller, Post, Body, UnauthorizedException, Get, Query, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(@Body() req: { email: string; password: string }, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.validateUser(req.email, req.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { access_token } = await this.authService.login(user);

    response.cookie('jwt', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site (if frontend/backend on diff domains), 'lax' for local
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return { message: 'Login successful', user, access_token };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.cookie('jwt', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      expires: new Date(0), // Forces immediate expiration in the past
    });
    return { message: 'Logged out successfully' };
  }

  @Post('signup')
  async signup(@Body() createUserDto: any, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.register(createUserDto) as any;
    // If registration returns a token (auto-login), set it in cookie
    if (result.access_token) {
      response.cookie('jwt', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }
    return result;
  }

  @Get('verify')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}
