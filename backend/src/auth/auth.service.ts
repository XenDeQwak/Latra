import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoginRequest } from './dto/LoginRequest';
import { SignupRequest } from './dto/SignupRequest';


const prisma = new PrismaClient();
@Injectable()
export class AuthService {
    login(loginRequest: LoginRequest) {
        const user = prisma.user.findUnique({
            where: {
                email: loginRequest.email,
                password: loginRequest.password
            }
        });

        if (!user) {
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
