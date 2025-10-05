import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StorageMsService } from './storage-ms.service';
import { GetUploadUrlDto } from './dto/getUploadUrl.dto';

@Controller()
export class StorageMsController {
  constructor(private readonly storageService: StorageMsService) {}

  // Generate upload URL
  @MessagePattern({ cmd: 'generate-upload-url' })
  async getUploadUrl(@Payload() data: GetUploadUrlDto) {
    return this.storageService.generateUploadUrl(data);
  }

  // Generate download URL
  @MessagePattern({ cmd: 'generate-download-url' })
  async getDownloadUrl(@Payload() data: { resourceId: string }) {
    return this.storageService.generateDownloadUrl(data.resourceId);
  }

  //  list resources by group
  @MessagePattern({ cmd: 'list-group-resources' })
  async listGroupResources(@Payload() data: { groupId: string }) {
    return this.storageService.listGroupResources(data.groupId);
  }

  // delete resource
  @MessagePattern({ cmd: 'delete-resource' })
  async deleteResource(@Payload() data: { resourceId: string }) {
    return this.storageService.deleteResource(data.resourceId);
  }

  //get resource data by an array of group ids
  @MessagePattern({ cmd: 'get-resources-by-group-ids' })
  async getResourcesByGroupIds(@Payload() data: { groups: string[] }) {
    return this.storageService.getResourcesByGroupIds(data.groups);
  }
}
