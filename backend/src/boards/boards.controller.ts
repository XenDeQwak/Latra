import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddUserToBoardRequest } from './dto/AddUserToBoardRequest';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  create(@Body() createBoardDto: CreateBoardDto) {
    return this.boardsService.create(createBoardDto);
  }

  @Post('add-user')
  addUserToBoard(@Body() addUserToBoardRequest: AddUserToBoardRequest) {
    return this.boardsService.addUserToBoard(addUserToBoardRequest);
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    const id = parseInt(userId, 10);
    if (isNaN(id)) throw new BadRequestException('userId must be a valid number');
    return this.boardsService.findAll(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boardsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardsService.update(+id, updateBoardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.boardsService.remove(+id);
  }
}
