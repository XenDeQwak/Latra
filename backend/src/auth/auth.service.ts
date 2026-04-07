import { Injectable } from '@nestjs/common';
import { LoginRequest } from './dto/LoginRequest';
import { SignupRequest } from './dto/SignupRequest';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}
    async login(loginRequest: LoginRequest) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: loginRequest.email
            }
        });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(loginRequest.password, user.password);

        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        return user;
    }

    signup(signupRequest: SignupRequest) {
        return this.prisma.user.create({
            data: {
                email: signupRequest.email,
                username: signupRequest.username,
                password: signupRequest.password
            }
        });
    }
}
