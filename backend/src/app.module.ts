import { Module } from '@nestjs/common';
import { BoardsModule } from './boards/boards.module';
import { CardsModule } from './cards/cards.module';
import { ListsModule } from './lists/lists.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [BoardsModule, CardsModule, ListsModule, UsersModule, AuthModule],
})
export class AppModule {}
