import { Controller } from '@nestjs/common';
import { ChatMsService } from './chat-ms.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateMessageDto } from './dto/createMessage.dto';



@Controller()
export class ChatMsController {
  constructor(private readonly chatMsService: ChatMsService) {}


  @MessagePattern({ cmd: 'create_message' })
  createMessage(@Payload() dto:CreateMessageDto) {
    console.log("DTO in controller:", dto);
    return this.chatMsService.createMessage(dto);
  }

  @MessagePattern({ cmd: 'get_messages' })
  getMessages(@Payload() roomId: string) {
    return this.chatMsService.getMessages(roomId);
  }

  @MessagePattern({cmd:'delete_group_chat'})
  deleteGroupChat(@Payload() groupId: string) {
    return this.chatMsService.deleteGroupChat(groupId);
  }
}