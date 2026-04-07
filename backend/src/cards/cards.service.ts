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
        ...createCardDto
      }
    });
  }

  findAll() {
    return `This action returns all cards`;
  }

  findOne(id: number) {
    return `This action returns a #${id} card`;
  }

  async update(id: number, updateCardDto: UpdateCardDto) {
    const listTitleMap = {
      [Status.TODO]: 'To-Do',
      [Status.IN_PROGRESS]: 'In Progress',
      [Status.REVIEW]: 'In Review',
      [Status.DONE]: 'Done',
    };

    // if any change in status, move the card to the corresponding list
    if (updateCardDto.status) {
      const card = await prisma.card.findUnique({
        where: { id },
        include: { list: true }
      });

      const targetList = await prisma.list.findFirst({
        where: {
          title: listTitleMap[updateCardDto.status],
          boardId: card?.list.boardId,
        }
      });

      return prisma.card.update({
        where: { id },
        data: {
          ...updateCardDto,
          listId: targetList?.id,
        }
      });
    }

    return prisma.card.update({
      where: { id },
      data: updateCardDto,
    });
  }

  remove(id: number) {
    return prisma.card.delete({
      where: { id }
    });
  }
}
