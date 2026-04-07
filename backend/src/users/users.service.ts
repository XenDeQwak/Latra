import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

@Injectable()
export class UsersService {
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)

    return prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        password: hashedPassword
      }
    });
  }

  findAll() {
    return prisma.user.findMany({
      select: { id: true, username: true, email: true },
    });
  }

  findOne(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    return prisma.user.update({ where: { id }, data: updateUserDto });
  }

  remove(id: number) {
    return prisma.user.delete({
      where: { id }
    });
  }
}
