import { Module } from '@nestjs/common';
import { BoardsModule } from './boards/boards.module';
import { CardsModule } from './cards/cards.module';
import { ListsModule } from './lists/lists.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [BoardsModule, CardsModule, ListsModule, UsersModule],
})
export class AppModule {}
