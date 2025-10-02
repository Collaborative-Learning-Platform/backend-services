import { Injectable, Inject } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Resource } from './entity/resource.entity';
import { ResourceTag } from './entity/resourceTags.entity';
import { v4 as uuid } from 'uuid';
import { GetUploadUrlDto } from './dto/getUploadUrl.dto';

@Injectable()
export class StorageMsService {
  constructor(
    @Inject('S3_CLIENT') private readonly s3: S3Client,
    @InjectRepository(Resource) private resourceRepo: Repository<Resource>,
    @InjectRepository(ResourceTag) private tagRepo: Repository<ResourceTag>,
  ) {}

  async generateUploadUrl(data: GetUploadUrlDto) {
    const { groupId, userId, fileName, contentType, tags, description, fileSize, estimatedCompletionTime } = data;
    const resourceId = uuid();
    const key = `groups/${groupId}/resources/${resourceId}-${fileName}`;

    const resource = this.resourceRepo.create({
      resourceId,
      groupId,
      userId,
      fileName,
      s3Key: key,
      contentType,
      description,
      size: fileSize,
      estimatedCompletionTime,
    });
    await this.resourceRepo.save(resource);

    if (tags?.length > 0) {
      const tagEntities = tags.map(t => this.tagRepo.create({ tag: t, resourceId }));
      await this.tagRepo.save(tagEntities);
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    console.log(uploadUrl)
    return { uploadUrl, resourceId };
  }

  async generateDownloadUrl(resourceId: string) {
    const resource = await this.resourceRepo.findOne({ where: { resourceId } });
    if (!resource) throw new Error('Resource not found');

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: resource.s3Key,
    });

    const downloadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    return { downloadUrl };
  }

  async listGroupResources(groupId: string) {
    try{
      const result = await this.resourceRepo.find({
        where: { groupId },
        relations: ['tags'],
      });
      return {
        success: true,
        data: result,
        message: 'Resources fetched successfully',
      }
    }catch (error) {
      console.error('Error listing group resources:', error);
      return { success: false, message: 'Error listing group resources' };
    }

    
  }

  async deleteResource(resourceId: string) {
    const resource = await this.resourceRepo.findOne({ where: { resourceId } });
    
    if (!resource) 
      return { success: false, message: 'Resource not found' };

    try{
      await this.s3.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: resource.s3Key,
      }));
      
    }catch (error) {
      console.error('Error deleting S3 object:', error);
      return { success: false, message: 'Error deleting S3 object' };
    }

    await this.resourceRepo.remove(resource);
    
    return { success: true, message: 'Resource deleted successfully' };
  }
}