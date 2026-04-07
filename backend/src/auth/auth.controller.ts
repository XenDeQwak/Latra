import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequest } from './dto/LoginRequest';
import { SignupRequest } from './dto/SignupRequest';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginRequest: LoginRequest) {
    return this.authService.login(loginRequest);
  }
  
  @Post('signup')
  signup(@Body() signupRequest: SignupRequest) {
    return this.authService.signup(signupRequest);
  }
}
