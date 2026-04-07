import { Injectable } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { PrismaClient } from '@prisma/client';
import { AddUserToBoardRequest } from './dto/AddUserToBoardRequest';

const prisma = new PrismaClient();

@Injectable()
export class BoardsService {
  create(createBoardDto: CreateBoardDto) {
    return prisma.board.create({
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
    return prisma.board.update({
      where: { id: addUserToBoardRequest.boardId },
      data: {
        users: {
          connect: { id: addUserToBoardRequest.userId }
        }
      }
    });
  }

  findAll() {
    return prisma.board.findMany({
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
    return prisma.board.findUnique({
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
