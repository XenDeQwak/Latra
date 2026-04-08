import { Injectable } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddUserToBoardRequest } from './dto/AddUserToBoardRequest';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}
  create(createBoardDto: CreateBoardDto) {
    return this.prisma.board.create({
      data: {
        title: createBoardDto.title,
        description: createBoardDto.description,
        lists: {
          create: [
              { title: 'To-Do' },
              { title: 'In Progress' },
              { title: 'In Review'},
              { title: 'Done' },
          ]
        }
      }
    });
  }

  addUserToBoard(addUserToBoardRequest: AddUserToBoardRequest) {
    return this.prisma.board.update({
      where: { id: addUserToBoardRequest.boardId },
      data: {
        users: {
          connect: { id: addUserToBoardRequest.userId }
        }
      }
    });
  }

  findAll(userId: number) {
    return this.prisma.board.findMany({
      where: { users: { some: { id: userId } } },
      include: {
        lists: {
          include: {
            cards: {
              include: {
                assignedUsers: {
                  select: { id: true, username: true, email: true },
                },
              },
            },
          },
        },
        users: { select: { id: true, username: true, email: true } },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.board.findUnique({
      where: { id },
      include: {
        lists: {
          include: {
            cards: {
              include: {
                assignedUsers: {
                  select: { id: true, username: true, email: true },
                },
              },
            },
          },
        },
        users: { select: { id: true, username: true, email: true } },
      },
    });
  }

  update(id: number, updateBoardDto: UpdateBoardDto) {
    return this.prisma.board.update({
      where: { id },
      data: {
        title: updateBoardDto.title
      }
    });
  }

  remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      
      await tx.card.deleteMany({
        where: {
          list: {
            boardId: id,
          },
        },
      });

      await tx.list.deleteMany({
        where: { boardId: id },
      });

      return tx.board.delete({
        where: { id },
      });
    });
  }
}
