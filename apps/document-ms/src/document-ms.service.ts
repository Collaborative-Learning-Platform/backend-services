import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from './entity/document.entity';
import { DocumentResponseDto } from './dto/document-response.dto';
import { ServiceResponse } from './interfaces/serviceresponse.interface';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { MyDocumentsResponseDto } from './dto/mydocuments-response.dto';

@Injectable()
export class DocumentMsService {
  constructor(
    @InjectRepository(Document) private docRepo: Repository<Document>,
    @Inject('WORKSPACE_SERVICE') private readonly WorkspaceClient: ClientProxy,
  ) {}

  private toResponseDto(doc: Document): DocumentResponseDto {
    return {
      documentId: doc.documentId,
      name: doc.name,
      title: doc.title,
      groupId: doc.groupId,
      createdBy: doc.createdBy,
    };
  }

  private toMyDocumentsResponseDto(doc: Document): MyDocumentsResponseDto {
    return {
      documentId: doc.documentId,
      name: doc.name,
      title: doc.title,
      groupId: doc.groupId,
      createdBy: doc.createdBy,
      lastEdited: doc.lastEdited.toISOString(),
      contributorIds: doc.contributorIds,
      sizeInBytes: doc.data ? doc.data.length : 0,
    };
  }

  async createDocument(
    dto: CreateDocumentDto,
  ): Promise<ServiceResponse<DocumentResponseDto>> {
    try {
      const name = `${dto.groupId}-${Date.now().toString(36)}`;
      const doc = this.docRepo.create({
        name,
        title: dto.title,
        groupId: dto.groupId,
        createdBy: dto.createdBy,
        contributorIds: [dto.createdBy],
      });

      const saved = await this.docRepo.save(doc);

      return {
        success: true,
        message: 'Document created successfully',
        data: this.toResponseDto(saved),
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to create document: ${err.message}`,
        status: 500,
      };
    }
  }

  async getDocumentById(
    id: string,
  ): Promise<ServiceResponse<DocumentResponseDto>> {
    const doc = await this.docRepo.findOneBy({ documentId: id });
    if (!doc) {
      return {
        success: false,
        message: 'Document not found',
        status: 404,
      };
    }

    return {
      success: true,
      message: 'Document fetched successfully',
      data: this.toResponseDto(doc),
    };
  }

  async getByRoomName(
    name: string,
  ): Promise<ServiceResponse<DocumentResponseDto>> {
    const doc = await this.docRepo.findOneBy({ name });
    if (!doc) {
      return {
        success: false,
        message: 'Document not found',
        status: 404,
      };
    }
    return {
      success: true,
      message: 'Document fetched successfully',
      data: this.toResponseDto(doc),
    };
  }

  async listByGroup(
    groupId: string,
  ): Promise<ServiceResponse<DocumentResponseDto[]>> {
    const docs = await this.docRepo.findBy({ groupId });
    return {
      success: true,
      message: 'Documents fetched successfully',
      data: docs.map(this.toResponseDto),
    };
  }

  async listByUserWorkspaceGroup(
    userId: string,
  ): Promise<ServiceResponse<any>> {
    try {
      const workspaceInfo = await lastValueFrom(
        this.WorkspaceClient.send(
          { cmd: 'get_user_workspaces_with_groups' },
          { userId: userId },
        ),
      );

      if (!workspaceInfo.success || !workspaceInfo.data) {
        return {
          success: false,
          message: 'Failed to fetch workspace/group info',
          status: 404,
        };
      }

      // workspaceInfo.data should be an array of workspaces
      // Each workspace: { workspaceId, workspaceName, groups: [{ groupId, groupName }] }
      type GroupResult = {
        groupId: string;
        name: string;
        documents: DocumentResponseDto[];
      };
      type WorkspaceResult = {
        workspaceId: string;
        name: string;
        groups: GroupResult[];
      };

      const result: WorkspaceResult[] = [];
      for (const ws of workspaceInfo.data) {
        const groups: GroupResult[] = [];
        for (const group of ws.groups) {
          // Fetch documents for this group
          const docs = await this.docRepo.findBy({ groupId: group.groupId });
          groups.push({
            groupId: group.groupId,
            name: group.name,
            documents: docs.map((doc) => this.toMyDocumentsResponseDto(doc)),
          });
        }
        result.push({
          workspaceId: ws.workspaceId,
          name: ws.name,
          groups,
        });
      }

      return {
        success: true,
        message: 'Documents grouped by workspace/group fetched successfully',
        data: result,
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to fetch documents: ${err.message}`,
        status: 500,
      };
    }
  }

  async updateMetadata(
    id: string,
    partial: Partial<Document>,
  ): Promise<ServiceResponse<DocumentResponseDto>> {
    const doc = await this.docRepo.findOneBy({ documentId: id });
    if (!doc) {
      return {
        success: false,
        message: 'Document not found',
        status: 404,
      };
    }
    Object.assign(doc, partial);

    const updated = await this.docRepo.save(doc);

    return {
      success: true,
      message: 'Document updated successfully',
      data: this.toResponseDto(updated),
    };
  }
}
