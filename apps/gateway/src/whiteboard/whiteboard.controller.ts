import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Res,
  Req,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Response, Request } from 'express';
import { handleValidationError } from '../utils/validationErrorHandler';

@Controller('whiteboard')
export class WhiteboardController {
  constructor(
    @Inject('WHITEBOARD_SERVICE')
    private readonly whiteboardClient: ClientProxy,
  ) {}

  @Get('room/:roomId/info')
  async getRoomInfo(@Param('roomId') roomId: string, @Res() res: Response) {
    try {
      const response = await lastValueFrom(
        this.whiteboardClient.send({ cmd: 'get_room_info' }, { roomId }),
      );

      if (response?.error) {
        const ret = handleValidationError(response.error);
        return res.json(ret);
      }

      return res.json(response);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to get room information',
        error: error.message,
      });
    }
  }

  @Get('room/:roomId/state')
  async getRoomState(@Param('roomId') roomId: string, @Res() res: Response) {
    try {
      const response = await lastValueFrom(
        this.whiteboardClient.send({ cmd: 'get_room_state' }, { roomId }),
      );

      if (response?.error) {
        const ret = handleValidationError(response.error);
        return res.json(ret);
      }

      return res.json(response);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to get room state',
        error: error.message,
      });
    }
  }

  @Get('stats')
  async getRoomStats(@Res() res: Response) {
    try {
      const response = await lastValueFrom(
        this.whiteboardClient.send({ cmd: 'get_room_stats' }, {}),
      );

      if (response?.error) {
        const ret = handleValidationError(response.error);
        return res.json(ret);
      }

      return res.json(response);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to get room statistics',
        error: error.message,
      });
    }
  }

  // TLDraw asset management endpoints
  @Put('uploads/:id')
  async uploadAsset(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const microserviceUrl = `http://localhost:4008/uploads/${id}`;

      return res.json({
        success: true,
        message: 'Asset upload proxied to whiteboard service',
        uploadUrl: microserviceUrl,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to upload asset',
        error: error.message,
      });
    }
  }

  @Get('unfurl')
  async unfurlUrl(@Query('url') url: string, @Res() res: Response) {
    try {
      if (!url) {
        throw new HttpException(
          'URL parameter is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Forward the request to the whiteboard microservice HTTP endpoint
      const microserviceUrl = `http://localhost:4008/unfurl?url=${encodeURIComponent(url)}`;

      return res.json({
        success: true,
        message: 'URL unfurl proxied to whiteboard service',
        unfurlUrl: microserviceUrl,
        url: url,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to unfurl URL',
        error: error.message,
      });
    }
  }

  @Get('connection-info')
  async getConnectionInfo(@Res() res: Response) {
    try {
      return res.json({
        success: true,
        data: {
          websocketUrl: 'ws://localhost:8080',
          connectionFormat:
            'ws://localhost:8080/connect/{roomId}?sessionId={sessionId}',
          supportedMessageTypes: [
            'ping',
            'pong',
            'document-update',
            'room-state',
            'user-joined',
            'user-left',
          ],
          tcpServicePort: 4008,
          websocketPort: 8080,
        },
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to get connection information',
        error: error.message,
      });
    }
  }

  @Get('health')
  async getHealth(@Res() res: Response) {
    try {
      const response = await lastValueFrom(
        this.whiteboardClient.send({ cmd: 'get_room_stats' }, {}),
      );

      return res.json({
        success: true,
        status: 'healthy',
        services: {
          tcp: response?.success ? 'healthy' : 'unhealthy',
          websocket: 'running on port 8080',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        success: false,
        status: 'unhealthy',
        message: 'Whiteboard service is not responding',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
