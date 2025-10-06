import { Injectable, Logger } from '@nestjs/common';
import * as WebSocket from 'ws';
import * as http from 'http';
import * as url from 'url';

interface JsonObject {
  [key: string]: any;
}

interface CustomSyncRoom {
  handleNewSession: (sessionId: string, socketAdapter: any) => () => void;
  handleMessage: (sessionId: string, message: any) => void;
  close: () => void;
}

interface RoomData {
  room: CustomSyncRoom;
  participants: Set<string>;
  createdAt: Date;
  lastActivity: Date;
  documentState: {
    shapes: Record<string, any>;
    bindings: Record<string, any>;
    assets: Record<string, any>;
    clock: number;
  };
}

@Injectable()
export class TldrawSyncService {
  private readonly logger = new Logger(TldrawSyncService.name);
  private wss: WebSocket.Server;
  private rooms: Map<string, RoomData> = new Map();
  private clientToRoom: Map<string, string> = new Map();

  initialize(server: http.Server): void {
    this.wss = new WebSocket.Server({
      server,
    });

    this.wss.on(
      'connection',
      (ws: WebSocket, request: http.IncomingMessage) => {
        this.handleConnection(ws, request);
      },
    );

    this.logger.log(
      'TLDraw sync server initialized - accepting connections on all paths',
    );
  }

  private async handleConnection(
    ws: WebSocket,
    request: http.IncomingMessage,
  ): Promise<void> {
    try {
      this.logger.log(`Incoming WebSocket connection: ${request.url}`);

      const urlPath = request.url || '';
      const pathParts = urlPath.split('/');

      let roomId = '';
      const connectIndex = pathParts.findIndex((part) => part === 'connect');
      if (connectIndex >= 0 && connectIndex + 1 < pathParts.length) {
        roomId = pathParts[connectIndex + 1].split('?')[0];
      }

      const parsedUrl = url.parse(request.url!, true);
      const sessionId =
        (parsedUrl.query.sessionId as string) || `session-${Date.now()}`;

      // this.logger.log(
      //   `Parsed connection: roomId=${roomId}, sessionId=${sessionId}`,
      // );

      if (!roomId || roomId === '') {
        this.logger.warn(
          `Missing or empty roomId in WebSocket connection: ${request.url}`,
        );
        ws.close(1008, 'Missing roomId');
        return;
      }

      this.logger.log(
        `TLDraw connection: room=${roomId}, session=${sessionId}`,
      );

      const roomData = this.getOrCreateRoom(roomId);

      this.clientToRoom.set(sessionId, roomId);
      roomData.participants.add(sessionId);
      roomData.lastActivity = new Date();

      const socketAdapter = {
        send: (message: JsonObject) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
          }
        },
        close: () => {
          ws.close();
        },
      };

      const removeSession = roomData.room.handleNewSession(
        sessionId,
        socketAdapter,
      );

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          roomData.room.handleMessage(sessionId, message);
          roomData.lastActivity = new Date();
        } catch (error) {
          this.logger.error(
            `Error handling message from ${sessionId}: ${error.message}`,
          );
        }
      });

      ws.on('close', () => {
        this.logger.log(
          `TLDraw disconnected: room=${roomId}, session=${sessionId}`,
        );
        removeSession();
        roomData.participants.delete(sessionId);
        this.clientToRoom.delete(sessionId);
        roomData.lastActivity = new Date();

        if (roomData.participants.size === 0) {
          setTimeout(
            () => {
              this.cleanupRoom(roomId);
            },
            5 * 60 * 1000,
          );
        }
      });

      ws.on('error', (error) => {
        this.logger.error(
          `WebSocket error for session ${sessionId}: ${error.message}`,
        );
      });
    } catch (error) {
      this.logger.error(`Error in TLDraw connection: ${error.message}`);
      ws.close(1011, 'Internal server error');
    }
  }

  private getOrCreateRoom(roomId: string): RoomData {
    let roomData = this.rooms.get(roomId);

    if (!roomData) {
      const room: CustomSyncRoom = this.createCustomSyncRoom(roomId);

      roomData = {
        room,
        participants: new Set(),
        createdAt: new Date(),
        lastActivity: new Date(),
        documentState: {
          shapes: {},
          bindings: {},
          assets: {},
          clock: 0,
        },
      };

      this.rooms.set(roomId, roomData);
      this.logger.log(`Created new custom sync room: ${roomId}`);
    }

    return roomData;
  }

  private createCustomSyncRoom(roomId: string): CustomSyncRoom {
    const sessions: Map<string, any> = new Map();

    return {
      handleNewSession: (sessionId: string, socketAdapter: any) => {
        sessions.set(sessionId, socketAdapter);

        socketAdapter.send({
          type: 'connect',
          connectEvent: {
            hydrationType: 'wipe_all',
            schema: { schemaVersion: 1, storeVersion: 4 },
            diff: {
              added: {},
              updated: {},
              removed: [],
            },
            serverClock: 0,
          },
        });

        this.logger.log(`Session ${sessionId} connected to room ${roomId}`);

        return () => {
          sessions.delete(sessionId);
          this.logger.log(`Session ${sessionId} removed from room ${roomId}`);
        };
      },

      handleMessage: (sessionId: string, message: any) => {
        switch (message.type) {
          case 'push':
            this.handlePushMessage(roomId, sessionId, message, sessions);
            break;
          case 'ping':
            const socket = sessions.get(sessionId);
            if (socket) {
              socket.send({ type: 'pong' });
            }
            break;
          default:
            this.logger.debug(`Unknown message type: ${message.type}`);
        }
      },

      close: () => {
        for (const [sessionId, socket] of sessions.entries()) {
          try {
            socket.close();
          } catch (error) {
            this.logger.error(
              `Error closing session ${sessionId}: ${error.message}`,
            );
          }
        }
        sessions.clear();
        this.logger.log(`Room ${roomId} closed`);
      },
    };
  }

  private handlePushMessage(
    roomId: string,
    sessionId: string,
    message: any,
    sessions: Map<string, any>,
  ): void {
    const roomData = this.rooms.get(roomId);
    if (!roomData) return;

    try {
      if (message.diff) {
        const { added, updated, removed } = message.diff;

        if (added) {
          Object.assign(roomData.documentState.shapes, added);
        }
        if (updated) {
          for (const [id, changes] of Object.entries(updated)) {
            if (roomData.documentState.shapes[id]) {
              Object.assign(roomData.documentState.shapes[id], changes);
            }
          }
        }
        if (removed && Array.isArray(removed)) {
          for (const id of removed) {
            delete roomData.documentState.shapes[id];
          }
        }

        roomData.documentState.clock += 1;
        roomData.lastActivity = new Date();
      }

      const broadcastMessage = {
        type: 'patch',
        diff: message.diff,
        serverClock: roomData.documentState.clock,
      };

      for (const [otherSessionId, socket] of sessions.entries()) {
        if (otherSessionId !== sessionId) {
          try {
            socket.send(broadcastMessage);
          } catch (error) {
            this.logger.error(
              `Error broadcasting to session ${otherSessionId}: ${error.message}`,
            );
          }
        }
      }

      const senderSocket = sessions.get(sessionId);
      if (senderSocket) {
        senderSocket.send({
          type: 'push_result',
          action: 'commit',
          serverClock: roomData.documentState.clock,
        });
      }
    } catch (error) {
      this.logger.error(`Error handling push message: ${error.message}`);
    }
  }

  private cleanupRoom(roomId: string): void {
    const roomData = this.rooms.get(roomId);
    if (roomData && roomData.participants.size === 0) {
      roomData.room.close();
      this.rooms.delete(roomId);
      this.logger.log(`Cleaned up empty room: ${roomId}`);
    }
  }

  getRoomStats() {
    const stats = {
      totalRooms: this.rooms.size,
      totalParticipants: 0,
      rooms: [] as any[],
    };

    for (const [roomId, roomData] of this.rooms.entries()) {
      stats.totalParticipants += roomData.participants.size;
      stats.rooms.push({
        roomId,
        participants: roomData.participants.size,
        createdAt: roomData.createdAt,
        lastActivity: roomData.lastActivity,
      });
    }

    return stats;
  }

  getRoomInfo(roomId: string) {
    const roomData = this.rooms.get(roomId);
    if (!roomData) {
      return null;
    }

    return {
      roomId,
      participants: roomData.participants.size,
      createdAt: roomData.createdAt,
      lastActivity: roomData.lastActivity,
      participantSessions: Array.from(roomData.participants),
    };
  }

  getWebSocketServer(): WebSocket.Server {
    return this.wss;
  }
}
