import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Query,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WhiteboardMsService } from './whiteboard-ms.service';
import { Request, Response } from 'express';

@Controller()
export class WhiteboardMsController {
  constructor(private readonly whiteboardMsService: WhiteboardMsService) {}

  @Get()
  getHello(): string {
    return this.whiteboardMsService.getHello();
  }
  @MessagePattern({ cmd: 'get_room_info' })
  getRoomInfo(@Payload() data: { roomId: string }) {
    try {
      const roomInfo = {
        roomId: data.roomId,
        status: 'active',
        participants: 0,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };
      return {
        success: true,
        data: roomInfo,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'get_room_stats' })
  getRoomStats() {
    try {
      const stats = {
        totalRooms: 0,
        activeConnections: 0,
        totalParticipants: 0,
        uptime: process.uptime(),
      };
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'get_room_state' })
  async getRoomState(@Payload() data: { roomId: string }) {
    try {
      const roomState = {
        roomId: data.roomId,
        documents: {},
        presence: {},
        clock: 0,
        lastUpdated: new Date().toISOString(),
      };
      return {
        success: true,
        data: roomState,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @MessagePattern({ cmd: 'store_update' })
  async storeUpdate(
    @Payload()
    data: {
      roomId: string;
      sessionId: string;
      update: any;
      clock: number;
    },
  ) {
    try {
      // For now, just acknowledge the update
      // In a real implementation, you might store this in a database
      console.log(
        `Storing update for room ${data.roomId} from session ${data.sessionId}`,
      );

      return {
        success: true,
        message: 'Update stored successfully',
        data: {
          roomId: data.roomId,
          sessionId: data.sessionId,
          clock: data.clock,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // HTTP endpoints for TLDraw asset management and unfurling

  /**
   * Upload asset endpoint for TLDraw
   * PUT /uploads/:id
   */
  @Put('uploads/:id')
  async uploadAsset(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // For now, return a mock success response
      // In production, you would handle actual file upload to cloud storage
      const assetUrl = `${req.protocol}://${req.get('host')}/uploads/${id}`;

      res.status(200).json({
        success: true,
        url: assetUrl,
        id: id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw new HttpException(
        `Failed to upload asset: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * URL unfurling endpoint for TLDraw
   * GET /unfurl?url=...
   */
  @Get('unfurl')
  async unfurlUrl(@Query('url') url: string) {
    try {
      if (!url) {
        throw new HttpException(
          'URL parameter is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        throw new HttpException('Invalid URL format', HttpStatus.BAD_REQUEST);
      }

      // For now, return a mock unfurl response
      // In production, you would fetch the URL and extract metadata
      const unfurlData = {
        success: true,
        url: url,
        title: 'Unfurled Content',
        description:
          'This is a mock unfurl response. In production, this would contain actual metadata from the URL.',
        image: null,
        favicon: null,
        timestamp: new Date().toISOString(),
      };

      return unfurlData;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to unfurl URL: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'whiteboard-ms',
    };
  }
}
