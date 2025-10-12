import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entity/chat-message.entity';
import { CreateMessageDto } from './dto/createMessage.dto';
import { MessageResponseDto } from './dto/messageResponse.dto';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

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

    return messages.map((m) => ({
      chatId: m.chatId,
      sender: m.sender,
      roomId: m.roomId,
      content: m.content,
      createdAt: m.createdAt,
    }));
  }

  async deleteGroupChat(groupId: string) {
    try {
      const deleteResult = await this.messageRepo.delete({ roomId: groupId });
      return {
        success: true,
        message: `Deleted ${deleteResult.affected} messages for group ${groupId}`,
      };
    } catch (error) {
      console.error('Failed to delete group chat messages', error);
      return {
        success: false,
        message: 'Failed to delete group chat messages: ' + error.message,
      };
    }
  }
}
