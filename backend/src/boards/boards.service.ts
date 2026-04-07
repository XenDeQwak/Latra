import { Injectable } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class BoardsService {
  create(createBoardDto: CreateBoardDto) {
    return prisma.board.create({
      data: {
        title: createBoardDto.title
      }
    });
  }

  findAll() {
    return `This action returns all boards`;
  }

  findOne(id: number) {
    return `This action returns a #${id} board`;
  }

  update(id: number, updateBoardDto: UpdateBoardDto) {
    return prisma.board.update({
      where: { id },
      data: {
        title: updateBoardDto.title
      }
    });
  }

  remove(id: number) {
    return prisma.board.delete({
      where: { id }
    });
  }
}
