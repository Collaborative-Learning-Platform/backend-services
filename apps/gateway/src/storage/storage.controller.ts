import {
  Controller,
  Post,
  Inject,
  Body,
  Get,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Controller('storage')
export class StorageController {
  constructor(
    @Inject('STORAGE_SERVICE') private readonly storageClient: ClientProxy,
  ) {}

  // Generate upload URL
  @Post('generate-upload-url')
  @UseGuards(AuthGuard)
  async generateUploadUrl(
    @Body()
    data: {
      groupId: string;
      userId: string;
      fileName: string;
      fileSize: number;
      description: string;
      contentType: string;
      tags: string[];
      estimatedCompletionTime?: number;
    },
  ) {
    console.log(data);
    return await lastValueFrom(
      this.storageClient.send({ cmd: 'generate-upload-url' }, data),
    );
  }

  // Generate download URL
  @Post('generate-download-url')
  @UseGuards(AuthGuard)
  async generateDownloadUrl(@Req() req: any) {
    const body = req.body;
    const userId = req.user.userId;
    console.log(userId);
    const data = {
      ...body,
      userId: userId,
    };
    return this.storageClient.send({ cmd: 'generate-download-url' }, data);
  }

  // Generate profile pic upload URL
  @Post('generate-profile-pic-upload-url')
  @UseGuards(AuthGuard)
  async generateProfilePicUploadUrl(
    @Body() data: { userId: string; fileName: string; contentType: string },
  ) {
    return this.storageClient.send(
      { cmd: 'generate-profile-pic-upload-url' },
      data,
    );
  }

  @Post('generate-profile-pic-download-url')
  @UseGuards(AuthGuard)
  async generateProfilePicDownloadUrl(@Body() data: { userId: string }) {
    return this.storageClient.send(
      { cmd: 'generate-profile-pic-download-url' },
      data,
    );
  }

  // List resources by group
  @Get('list-group-resources/:groupId')
  @UseGuards(AuthGuard)
  async listGroupResources(@Param('groupId') groupId: string) {
    const result = await lastValueFrom(
      this.storageClient.send({ cmd: 'list-group-resources' }, { groupId }),
    );
    return result;
  }

  @Delete('delete-resource/:resourceId')
  @UseGuards(AuthGuard)
  async deleteResource(@Param('resourceId') resourceId: string) {
    return this.storageClient.send({ cmd: 'delete-resource' }, { resourceId });
  }
}
