import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Response } from 'express';
import { handleValidationError } from '../utils/validationErrorHandler';

@Controller('documents')
export class DocumentController {
  constructor(
    @Inject('DOCUMENT_SERVICE') private readonly DocumentClient: ClientProxy,
  ) {}

  // --- Create Document ---
  @Post('create')
  async createDocument(@Body() data: any, @Res() res: Response) {
    const response = await lastValueFrom(
      this.DocumentClient.send({ cmd: 'create_document' }, data),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Failed to create document',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      message: 'Document created successfully',
      data: response.data,
    });
  }

  // --- Get Document by ID ---
  @Get(':id')
  async getDocumentById(@Param('id') id: string, @Res() res: Response) {
    const response = await lastValueFrom(
      this.DocumentClient.send({ cmd: 'get_document_by_id' }, id),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Document not found',
        status: response.status || 404,
      });
    }

    return res.json({
      success: true,
      message: 'Document fetched successfully',
      data: response.data,
    });
  }

  // --- Get Document by Room Name ---
  @Get('room/:roomName')
  async getByRoomName(
    @Param('roomName') roomName: string,
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.DocumentClient.send({ cmd: 'get_document_by_room' }, roomName),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Document not found',
        status: response.status || 404,
      });
    }

    return res.json({
      success: true,
      message: 'Document fetched successfully',
      data: response.data,
    });
  }

  // --- List Documents by Group ---
  @Get('group/:groupId')
  async listByGroup(@Param('groupId') groupId: string, @Res() res: Response) {
    const response = await lastValueFrom(
      this.DocumentClient.send({ cmd: 'list_documents_by_group' }, groupId),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Failed to fetch documents for group',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      message: 'Documents fetched successfully',
      data: response.data,
    });
  }

  // --- List Documents by User ---
  @Get('user/:userId')
  async listByUser(@Param('userId') userId: string, @Res() res: Response) {
    const response = await lastValueFrom(
      this.DocumentClient.send({ cmd: 'list_documents_by_user' }, userId),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Failed to fetch documents for user',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      message: 'Documents fetched successfully',
      data: response.data,
    });
  }

  // --- Update Document Metadata ---
  @Put(':id')
  async updateMetadata(
    @Param('id') id: string,
    @Body() partial: any,
    @Res() res: Response,
  ) {
    const response = await lastValueFrom(
      this.DocumentClient.send(
        { cmd: 'update_document_metadata' },
        { id, partial },
      ),
    );

    if (response?.error) {
      const ret = handleValidationError(response.error);
      return res.json(ret);
    }

    if (!response?.success) {
      return res.json({
        success: false,
        message: response.message || 'Failed to update document',
        status: response.status || 400,
      });
    }

    return res.json({
      success: true,
      message: 'Document updated successfully',
      data: response.data,
    });
  }
}
