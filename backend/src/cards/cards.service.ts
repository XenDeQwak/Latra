import { Injectable } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { PrismaClient } from '@prisma/client';
import { Status } from '@prisma/client';

const prisma = new PrismaClient();
@Injectable()
export class CardsService {
  create(createCardDto: CreateCardDto) {
    return prisma.card.create({
      data: {
        title: createCardDto.title,
        description: createCardDto.description,
        status: createCardDto.status,
        deadline: createCardDto.deadline,
        listId: createCardDto.listId,
      }
    });
  }

  findAll() {
    return `This action returns all cards`;
  }

  findOne(id: number) {
    return `This action returns a #${id} card`;
  }

  update(id: number, updateCardDto: UpdateCardDto) {
    return prisma.card.update({
      where: { id },
      data: {
        title: updateCardDto.title,
        description: updateCardDto.description,
        status: updateCardDto.status,
        deadline: updateCardDto.deadline,
        listId: updateCardDto.listId,
      }
    });
  }

  remove(id: number) {
    return prisma.card.delete({
      where: { id }
    });
  }
}
