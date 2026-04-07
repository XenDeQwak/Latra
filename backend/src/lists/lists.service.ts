import { Injectable } from '@nestjs/common';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ListsService {
  create(createListDto: CreateListDto) {
    return prisma.list.create({
      data: {
        title: createListDto.title,
        boardId: createListDto.boardId
      }
    })
  }

  findAll() {
    return prisma.list.findMany({
      include: { cards: true },
    });
  }

  findOne(id: number) {
    return prisma.list.findUnique({
      where: { id },
      include: { cards: true },
    });
  }

  update(id: number, updateListDto: UpdateListDto) {
    return prisma.list.update({
      where: { id },
      data: {
        title: updateListDto.title
      }
    })
  }

  remove(id: number) {
    return prisma.list.delete({
      where: { id }
    })
  }
}
