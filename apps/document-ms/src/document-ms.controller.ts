import { Controller } from '@nestjs/common';
import { DocumentMsService } from './document-ms.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import {
  DocumentResponseDto,
  ContributorResponseDto,
} from './dto/document-response.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ServiceResponse } from './interfaces/serviceresponse.interface';

@Controller('documents')
export class DocumentMsController {
  constructor(private readonly documentMsService: DocumentMsService) {}

  // --- List documents by user's workspace, group ---
  @MessagePattern({ cmd: 'list_documents_by_user' })
  async listByUser(@Payload() userId: string): Promise<ServiceResponse<any>> {
    return this.documentMsService.listByUserWorkspaceGroup(userId);
  }

  // --- Get a document by ID ---
  @MessagePattern({ cmd: 'get_document_by_id' })
  async getDocumentById(
    @Payload() id: string,
  ): Promise<ServiceResponse<DocumentResponseDto>> {
    return this.documentMsService.getDocumentById(id);
  }

  // --- Create a new document ---
  @MessagePattern({ cmd: 'create_document' })
  async createDocument(
    @Payload() dto: CreateDocumentDto,
  ): Promise<ServiceResponse<DocumentResponseDto>> {
    return this.documentMsService.createDocument(dto);
  }

  // --- Update metadata ---
  @MessagePattern({ cmd: 'update_document_metadata' })
  async updateMetadata(
    @Payload() payload: { id: string; partial: Partial<Document> },
  ): Promise<ServiceResponse<DocumentResponseDto>> {
    const { id, partial } = payload;
    return this.documentMsService.updateMetadata(id, partial);
  }

  // --- List documents by group ---
  @MessagePattern({ cmd: 'list_documents_by_group' })
  async listByGroup(
    @Payload() groupId: string,
  ): Promise<ServiceResponse<DocumentResponseDto[]>> {
    return this.documentMsService.listByGroup(groupId);
  }

  // --- Get a document by room name ---
  @MessagePattern({ cmd: 'get_document_by_room' })
  async getByRoomName(
    @Payload() roomName: string,
  ): Promise<ServiceResponse<DocumentResponseDto>> {
    return this.documentMsService.getByRoomName(roomName);
  }

  // --- Update contributors ---
  @MessagePattern({ cmd: 'update_document_contributors' })
  async updateContributors(
    @Payload() payload: { id: string; contributorIds: string[] },
  ): Promise<ServiceResponse<ContributorResponseDto>> {
    const { id, contributorIds } = payload;
    return this.documentMsService.updateContributors(id, contributorIds);
  }
}
