import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entity/chat-message.entity';
import { CreateMessageDto } from './dto/createMessage.dto';
import { MessageResponseDto } from './dto/messageResponse.dto';

@Injectable()
export class ChatMsService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
  ) {}

  async createMessage(dto: CreateMessageDto) {
    const msg = this.messageRepo.create(dto);
    const saved = await this.messageRepo.save(msg);

    const response: MessageResponseDto = {
      chatId: saved.chatId,
      sender: saved.sender,
      roomId: saved.roomId,
      content: saved.content,
      createdAt: saved.createdAt,
    };

    return response;
  }

  async getMessages(roomId: string) {
    const messages = await this.messageRepo.find({
    where: { roomId },
    order: { createdAt: 'ASC' },
    });

    return messages.map(m => ({
      chatId: m.chatId,
      sender: m.sender,
      roomId: m.roomId,
      content: m.content,
      createdAt: m.createdAt,
    }));
  }
}
