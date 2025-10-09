import { WebSocketServer, WebSocket } from 'ws';

interface Room {
  id: string;
  clients: Map<string, WebSocket>;
  documentState: any;
  createdAt: Date;
  lastActivity: Date;
}

interface ClientSession {
  id: string;
  roomId: string;
  ws: WebSocket;
  joinedAt: Date;
}

const rooms = new Map<string, Room>();
const sessions = new Map<string, ClientSession>();

function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    const room: Room = {
      id: roomId,
      clients: new Map(),
      documentState: {
        shapes: {},
        bindings: {},
        assets: {},
        pages: {},
        documents: {},
        instances: {},
        clock: 0,
      },
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    rooms.set(roomId, room);
    console.log(`Created new room: ${roomId}`);
  }
  return rooms.get(roomId)!;
}

function broadcastToRoom(
  roomId: string,
  message: any,
  excludeSessionId?: string,
) {
  const room = rooms.get(roomId);
  if (!room) {
    console.warn(`Cannot broadcast - room ${roomId} not found`);
    return;
  }

  const messageStr = JSON.stringify(message);
  let broadcastCount = 0;

  console.log(
    `📡 Broadcasting to room ${roomId} (excluding ${excludeSessionId || 'none'})`,
  );
  console.log(`Total clients in room: ${room.clients.size}`);

  room.clients.forEach((ws, sessionId) => {
    if (sessionId !== excludeSessionId) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          broadcastCount++;
          console.log(`  Sent to ${sessionId}`);
        } catch (error) {
          console.error(`Failed to send to ${sessionId}:`, error.message);
        }
      } else {
        console.warn(
          `  Connection to ${sessionId} is not open (state: ${ws.readyState})`,
        );
      }
    } else {
      console.log(`Skipping sender ${sessionId}`);
    }
  });

  console.log(`Successfully broadcasted to ${broadcastCount} clients`);
}

function handleJoinRoom(sessionId: string, roomId: string, ws: WebSocket) {
  const room = getOrCreateRoom(roomId);

  room.clients.set(sessionId, ws);
  room.lastActivity = new Date();

  sessions.set(sessionId, {
    id: sessionId,
    roomId,
    ws,
    joinedAt: new Date(),
  });

  const records: Record<string, any> = {};

  Object.values(room.documentState.shapes).forEach((shape: any) => {
    records[shape.id] = shape;
  });
  Object.values(room.documentState.bindings).forEach((binding: any) => {
    records[binding.id] = binding;
  });
  Object.values(room.documentState.assets).forEach((asset: any) => {
    records[asset.id] = asset;
  });
  Object.values(room.documentState.pages).forEach((page: any) => {
    records[page.id] = page;
  });
  Object.values(room.documentState.documents).forEach((document: any) => {
    records[document.id] = document;
  });
  Object.values(room.documentState.instances).forEach((instance: any) => {
    records[instance.id] = instance;
  });

  ws.send(
    JSON.stringify({
      type: 'room-state',
      roomId,
      state: {
        records,
        clock: room.documentState.clock,
      },
      participants: Array.from(room.clients.keys()),
      timestamp: Date.now(),
    }),
  );

  broadcastToRoom(
    roomId,
    {
      type: 'user-joined',
      sessionId,
      timestamp: Date.now(),
    },
    sessionId,
  );

  console.log(
    `Session ${sessionId} joined room ${roomId}. Total clients: ${room.clients.size}`,
  );
}

function handleLeaveRoom(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const room = rooms.get(session.roomId);
  if (room) {
    room.clients.delete(sessionId);
    room.lastActivity = new Date();

    broadcastToRoom(session.roomId, {
      type: 'user-left',
      sessionId,
      timestamp: Date.now(),
    });

    if (room.clients.size === 0) {
      console.log(`Room ${session.roomId} is empty, cleaning up...`);
      rooms.delete(session.roomId);
    }
  }

  sessions.delete(sessionId);
  console.log(`Session ${sessionId} left room ${session.roomId}`);
}

function handleDocumentUpdate(sessionId: string, data: any) {
  const session = sessions.get(sessionId);
  if (!session) {
    console.warn(`No session found for ${sessionId}`);
    return;
  }

  const room = rooms.get(session.roomId);
  if (!room) {
    console.warn(`No room found for ${session.roomId}`);
    return;
  }

  console.log(
    `Updating room ${session.roomId} with data:`,
    JSON.stringify(data, null, 2),
  );

  if (data && data.records) {
    console.log(`Processing ${Object.keys(data.records).length} records`);

    Object.values(data.records).forEach((record: any) => {
      if (!record || !record.id || !record.typeName) {
        console.warn('Invalid record:', record);
        return;
      }

      switch (record.typeName) {
        case 'shape':
          room.documentState.shapes[record.id] = record;
          console.log(`Stored shape: ${record.id}`);
          break;
        case 'binding':
          room.documentState.bindings[record.id] = record;
          console.log(`Stored binding: ${record.id}`);
          break;
        case 'asset':
          room.documentState.assets[record.id] = record;
          console.log(`Stored asset: ${record.id}`);
          break;
        case 'page':
          room.documentState.pages[record.id] = record;
          console.log(`Stored page: ${record.id}`);
          break;
        case 'document':
          room.documentState.documents[record.id] = record;
          console.log(`Stored document: ${record.id}`);
          break;
        case 'instance':
          room.documentState.instances[record.id] = record;
          console.log(`Stored instance: ${record.id}`);
          break;
        default:
          console.warn(`Unknown record type: ${record.typeName}`);
      }
    });
  } else {
    console.warn(`No records found in data:`, data);
  }

  if (data && data.removedIds && Array.isArray(data.removedIds)) {
    console.log(`Processing ${data.removedIds.length} removals`);

    data.removedIds.forEach((removedId: string) => {
      let removed = false;

      if (room.documentState.shapes[removedId]) {
        delete room.documentState.shapes[removedId];
        console.log(`Removed shape: ${removedId}`);
        removed = true;
      }
      if (room.documentState.bindings[removedId]) {
        delete room.documentState.bindings[removedId];
        console.log(` Removed binding: ${removedId}`);
        removed = true;
      }
      if (room.documentState.assets[removedId]) {
        delete room.documentState.assets[removedId];
        console.log(`Removed asset: ${removedId}`);
        removed = true;
      }
      if (room.documentState.pages[removedId]) {
        delete room.documentState.pages[removedId];
        console.log(`Removed page: ${removedId}`);
        removed = true;
      }
      if (room.documentState.documents[removedId]) {
        delete room.documentState.documents[removedId];
        console.log(`Removed document: ${removedId}`);
        removed = true;
      }
      if (room.documentState.instances[removedId]) {
        delete room.documentState.instances[removedId];
        console.log(`Removed instance: ${removedId}`);
        removed = true;
      }

      if (!removed) {
        console.warn(`Could not find record to remove: ${removedId}`);
      }
    });
  }

  room.documentState.clock++;
  room.lastActivity = new Date();

  console.log(
    `📡 Broadcasting update from ${sessionId} to ${room.clients.size - 1} other clients in room ${session.roomId}`,
  );
  // Create the broadcast message
  const broadcastMessage = {
    type: 'document-update',
    sessionId,
    data: {
      records: data.records || {},
      removedIds: data.removedIds || [],
    },
    clock: room.documentState.clock,
    timestamp: Date.now(),
  };

  console.log(
    `📤 Broadcasting message:`,
    JSON.stringify(broadcastMessage, null, 2),
  );

  
  broadcastToRoom(session.roomId, broadcastMessage, sessionId);
}

/** Start WebSocket server */
export function bootstrapSyncServer(wsPort: number) {
  const wss = new WebSocketServer({ port: wsPort });

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const path = url.pathname; 
    const pathParts = path.split('/').filter(Boolean);

    if (pathParts.length < 2 || pathParts[0] !== 'connect') {
      console.warn(`Invalid WebSocket path: ${path}`);
      ws.close(1008, 'Invalid path format. Expected /connect/roomId');
      return;
    }

    const roomId = pathParts[1];
    const sessionId =
      url.searchParams.get('sessionId') ||
      'session-' + Math.random().toString(36).substr(2, 9);

    console.log(`WebSocket connecting: room=${roomId}, session=${sessionId}`);

    try {
     
      handleJoinRoom(sessionId, roomId, ws);
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log(
            `📨 Received message from ${sessionId}:`,
            JSON.stringify(message, null, 2),
          );

          switch (message.type) {
            case 'document-update':
              console.log(`Processing document update from ${sessionId}`);
              handleDocumentUpdate(sessionId, message.data);
              break;
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              break;
            default:
              console.warn(`Unknown message type: ${message.type}`);
          }
        } catch (error) {
          console.error(
            `Error processing message from session ${sessionId}:`,
            error,
          );
        }
      });

      
      ws.on('close', () => {
        console.log(
          `WebSocket disconnected: room=${roomId}, session=${sessionId}`,
        );
        handleLeaveRoom(sessionId);
      });

      
      ws.on('error', (error) => {
        console.error(`WebSocket error for session ${sessionId}:`, error);
        handleLeaveRoom(sessionId);
      });
    } catch (error) {
      console.error(`Error setting up WebSocket connection:`, error);
      ws.close(1011, 'Internal server error');
    }
  });

  console.log(
    `Simple Whiteboard WebSocket server running on ws://localhost:${wsPort}`,
  );
  console.log(
    `Connect using: ws://localhost:${wsPort}/connect/{roomId}?sessionId={sessionId}`,
  );

 
  setInterval(
    () => {
      const now = new Date();
      for (const [roomId, room] of rooms.entries()) {
        const inactiveTime = now.getTime() - room.lastActivity.getTime();
        if (inactiveTime > 5 * 60 * 1000 && room.clients.size === 0) {
          
          console.log(`Cleaning up inactive room: ${roomId}`);
          rooms.delete(roomId);
        }
      }
    },
    5 * 60 * 1000,
  );

  return wss;
}
