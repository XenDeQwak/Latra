import { Injectable } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { Status } from '@prisma/client';
import { AddUserToCardRequest } from './dto/AddUserToCardRequest';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}
  create(createCardDto: CreateCardDto) {
    return this.prisma.card.create({
      data: createCardDto
    });
  }

  findAll() {
    return this.prisma.card.findMany({
      include: {
        assignedUsers: {
          select: { id: true, username: true, email: true },
        },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.card.findUnique({
      where: { id },
      include: {
        assignedUsers: {
          select: { id: true, username: true, email: true },
        },
      },
    });
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
      const card = await this.prisma.card.findUnique({
        where: { id },
        include: { list: true }
      });

      const targetList = await this.prisma.list.findFirst({
        where: {
          title: listTitleMap[updateCardDto.status],
          boardId: card?.list.boardId,
        }
      });

      return this.prisma.card.update({
        where: { id },
        data: {
          ...updateCardDto,
          listId: targetList?.id,
        }
      });
    }

    return this.prisma.card.update({
      where: { id },
      data: updateCardDto,
    });
  }

  addUserToCard(addUserToCardRequest: AddUserToCardRequest) {
    return this.prisma.card.update({
      where: { id: addUserToCardRequest.cardId },
      data: {
        assignedUsers: {
          connect: { id: addUserToCardRequest.userId }
        }
      }
    });
  }

  remove(id: number) {
    return this.prisma.card.delete({
      where: { id }
    });
  }
}
