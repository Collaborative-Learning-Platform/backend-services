import { Module } from '@nestjs/common';
import { WhiteboardMsController } from './whiteboard-ms.controller';
import { WhiteboardMsService } from './whiteboard-ms.service';

@Module({
  imports: [],
  controllers: [WhiteboardMsController],
  providers: [WhiteboardMsService],
  exports: [WhiteboardMsService],
})
export class WhiteboardMsModule {}
