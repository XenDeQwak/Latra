import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoginRequest } from './dto/LoginRequest';
import { SignupRequest } from './dto/SignupRequest';
import * as bcrypt from 'bcrypt';


const prisma = new PrismaClient();
@Injectable()
export class AuthService {
    async login(loginRequest: LoginRequest) {
        const user = await prisma.user.findUnique({
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
        return prisma.user.create({
            data: {
                email: signupRequest.email,
                username: signupRequest.username,
                password: signupRequest.password
            }
        });
    }
}
