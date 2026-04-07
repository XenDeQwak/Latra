import { Injectable } from '@nestjs/common';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ListsService {

  constructor(private readonly prisma: PrismaService) {}

  create(createListDto: CreateListDto) {
    return this.prisma.list.create({
      data: {
        title: createListDto.title,
        boardId: createListDto.boardId
      }
    })
  }

  findAll() {
    return this.prisma.list.findMany({
      include: { cards: true },
    });
  }

  findOne(id: number) {
    return this.prisma.list.findUnique({
      where: { id },
      include: { cards: true },
    });
  }

  update(id: number, updateListDto: UpdateListDto) {
    return this.prisma.list.update({
      where: { id },
      data: {
        title: updateListDto.title
      }
    })
  }

  remove(id: number) {
    return this.prisma.list.delete({
      where: { id }
    })
  }
}
