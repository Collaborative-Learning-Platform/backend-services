import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Server, Socket } from 'socket.io';
import { lastValueFrom } from 'rxjs';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/whiteboard',
})
export class WhiteboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WhiteboardGateway.name);

  constructor(
    @Inject('WHITEBOARD_SERVICE')
    private readonly whiteboardClient: ClientProxy,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to whiteboard: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from whiteboard: ${client.id}`);
  }
  @SubscribeMessage('join_room')
  async joinRoom(
    @MessageBody() data: { roomId: string; sessionId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, sessionId } = data;

    this.logger.log(`Client ${client.id} joining whiteboard room: ${roomId}`); // Join the Socket.IO room
    await client.join(roomId);

    try {
      const room = this.server?.sockets?.adapter?.rooms?.get(roomId);
      const roomMembers = room ? Array.from(room) : [];
      this.logger.log(
        `After join: Room ${roomId} has ${roomMembers.length} members: ${roomMembers.join(', ')}`,
      );
    } catch (error) {
      this.logger.warn(`Could not check room membership: ${error.message}`);
    }

    try {
      const roomInfo = await lastValueFrom(
        this.whiteboardClient.send({ cmd: 'get_room_info' }, { roomId }),
      );

      client.emit('room_joined', {
        roomId,
        sessionId:
          sessionId ||
          `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        roomInfo: roomInfo?.data || {},
      });

      client.to(roomId).emit('user_joined', {
        sessionId: sessionId || client.id,
        timestamp: Date.now(),
      });

      this.logger.log(`Client ${client.id} successfully joined room ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to join room ${roomId}:`, error);
      client.emit('error', {
        message: 'Failed to join room',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('leave_room')
  async leaveRoom(
    @MessageBody() data: { roomId: string; sessionId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, sessionId } = data;

    this.logger.log(`Client ${client.id} leaving whiteboard room: ${roomId}`);

    await client.leave(roomId);

    client.to(roomId).emit('user_left', {
      sessionId: sessionId || client.id,
      timestamp: Date.now(),
    });

    client.emit('room_left', { roomId });
  }
  @SubscribeMessage('document_update')
  async handleDocumentUpdate(
    @MessageBody()
    data: {
      roomId: string;
      sessionId: string;
      update: any;
      clock: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, sessionId, update, clock } = data; // Detailed debug logging
    this.logger.log(
      `Document update received from ${sessionId} in room ${roomId}`,
    );
    this.logger.log(
      `Update contains: added=${update?.added?.length || 0}, updated=${update?.updated?.length || 0}, removed=${update?.removed?.length || 0}`,
    );

    try {
      const room = this.server?.sockets?.adapter?.rooms?.get(roomId);
      const roomMembers = room ? Array.from(room) : [];
      this.logger.log(
        `👥 Room ${roomId} has ${roomMembers.length} members: ${roomMembers.join(', ')}`,
      );
    } catch (error) {
      this.logger.warn(`Could not check room membership: ${error.message}`);
    }

    if (update) {
      const updateSummary = {
        added: update.added ? `${update.added.length} items` : 'none',
        updated: update.updated ? `${update.updated.length} items` : 'none',
        removed: update.removed ? `${update.removed.length} items` : 'none',
      };
      // this.logger.log(`Update summary: ${JSON.stringify(updateSummary)}`);
    }

    // this.logger.log(
    //   `Broadcasting to room ${roomId}, excluding sender ${client.id}`,
    // );
    client.to(roomId).emit('document_update', {
      sessionId,
      update,
      clock,
      timestamp: Date.now(),
    });

    try {
      await lastValueFrom(
        this.whiteboardClient.send(
          { cmd: 'store_update' },
          { roomId, sessionId, update, clock },
        ),
      );
      this.logger.log(`Stored update for room ${roomId}`);
    } catch (error) {
      this.logger.warn(
        `Failed to store update for room ${roomId}:`,
        error.message,
      );
    }
  }

  @SubscribeMessage('get_room_state')
  async getRoomState(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;

    try {
      const roomState = await lastValueFrom(
        this.whiteboardClient.send({ cmd: 'get_room_state' }, { roomId }),
      );

      client.emit('room_state', {
        roomId,
        state: roomState?.data || {},
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(`Failed to get room state for ${roomId}:`, error);
      client.emit('error', {
        message: 'Failed to get room state',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  
  async broadcastToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  
  async getRoomParticipants(roomId: string): Promise<number> {
    const room = this.server.sockets.adapter.rooms.get(roomId);
    return room ? room.size : 0;
  }
}
