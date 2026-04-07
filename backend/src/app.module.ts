import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BoardsModule } from './boards/boards.module';
import { CardsModule } from './cards/cards.module';
import { ListsModule } from './lists/lists.module';

@Module({
  imports: [BoardsModule, CardsModule, ListsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
