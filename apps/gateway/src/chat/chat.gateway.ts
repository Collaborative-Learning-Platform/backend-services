import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Server, Socket } from 'socket.io';
import { lastValueFrom } from 'rxjs';


@WebSocketGateway({
  cors: { origin: '*' }, 
  
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(@Inject('CHAT_SERVICE') private chatClient: ClientProxy) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  joinRoom(@MessageBody() roomId: string, @ConnectedSocket() client: Socket) {
    client.join(roomId);
    client.emit('joined_room', { roomId });
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @MessageBody() data: { senderId: string; roomId: string; content: string },
  ) {
    
    const savedMessage = await lastValueFrom(this.chatClient
      .send({ cmd: 'create_message' }, data));

    
    this.server.to(data.roomId).emit('receive_message', savedMessage);
  }

  @SubscribeMessage('get_messages')
  async getMessages(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const messages = await lastValueFrom(this.chatClient.send({ cmd: 'get_messages' }, roomId));

    client.emit('messages', messages);
  }
}
