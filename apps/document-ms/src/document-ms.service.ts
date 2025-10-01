import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from './entity/document.entity';
import { DocumentResponseDto } from './dto/document-response.dto';
import { ServiceResponse } from './interfaces/serviceresponse.interface';

@Injectable()
export class DocumentMsService {
  constructor(
    @InjectRepository(Document) private docRepo: Repository<Document>,
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

  async listByUser(
    userId: string,
  ): Promise<ServiceResponse<DocumentResponseDto[]>> {
    const docs = await this.docRepo
      .createQueryBuilder('document')
      .where(':uid = ANY(document.contributorIds)', { uid: userId })
      .orWhere('document.createdBy = :uid', { uid: userId })
      .getMany();

    return {
      success: true,
      message: 'Documents fetched successfully',
      data: docs.map(this.toResponseDto),
    };
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
