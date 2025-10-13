import { Injectable, Inject } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Resource } from './entity/resource.entity';
import { ResourceTag } from './entity/resourceTags.entity';
import { v4 as uuid } from 'uuid';
import { GetUploadUrlDto } from './dto/getUploadUrl.dto';
import { In } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class StorageMsService {
  constructor(
    @Inject('S3_CLIENT') private readonly s3: S3Client,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('ANALYTICS_SERVICE') private readonly analyticsClient: ClientProxy,
    @InjectRepository(Resource) private resourceRepo: Repository<Resource>,
    @InjectRepository(ResourceTag) private tagRepo: Repository<ResourceTag>,
  ) {}

  async generateUploadUrl(data: GetUploadUrlDto) {
    const {
      groupId,
      userId,
      fileName,
      contentType,
      tags,
      description,
      fileSize,
      estimatedCompletionTime,
    } = data;
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
      const tagEntities = tags.map((t) =>
        this.tagRepo.create({ tag: t, resourceId }),
      );
      await this.tagRepo.save(tagEntities);
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });

    // Send a message to analytics microservice to log activity
    await lastValueFrom(
      this.analyticsClient.send(
        { cmd: 'log_user_activity' },
        {
          user_id: userId,
          category: 'RESOURCE',
          activity_type: 'UPLOADED_RESOURCE',
          metadata: {
            resourceId: resource.resourceId,
            fileName: resource.fileName,
            fileSize: resource.size,
            contentType: resource.contentType,
          },
        },
      ),
    );
    console.log(uploadUrl);
    return { uploadUrl, resourceId };
  }

  async generateDownloadUrl(resourceId: string, userId?: string) {
    const resource = await this.resourceRepo.findOne({ where: { resourceId } });
    if (!resource) throw new Error('Resource not found');

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: resource.s3Key,
    });

    const downloadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 300,
    });

    // Send a message to analytics microservice to log activity only if userId is provided
    if (userId) {
      await lastValueFrom(
        this.analyticsClient.send(
          { cmd: 'log_user_activity' },
          {
            user_id: userId,
            category: 'RESOURCE',
            activity_type: 'DOWNLOADED_RESOURCE',
            metadata: {
              resourceId: resource.resourceId,
              fileName: resource.fileName,
              fileSize: resource.size,
              contentType: resource.contentType,
            },
          },
        ),
      );
    }

    return { downloadUrl };
  }

  async generateProfilePicUploadUrl(
    userId: string,
    fileName: string,
    contentType: string,
  ) {
    const key = `users/${userId}/profile-pics/${uuid()}-${fileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3, command, {
        expiresIn: 300,
      });

      const result = await lastValueFrom(
        this.authClient.send(
          { cmd: 'auth_store_profile_pic_url' },
          { userId, profilePicUrl: key },
        ),
      );

      if (!result?.success) {
        throw new Error('Failed to store profile picture URL in auth service');
      }

      return { uploadUrl, key, success: true };
    } catch (error) {
      console.error('Error generating profile pic upload URL:', error);
      return { success: false, message: error.message };
    }
  }

  async generateProfilePicDownloadUrl(userId: string) {
    try {
      const result = await lastValueFrom(
        this.authClient.send({ cmd: 'get_profile_picture_url' }, { userId }),
      );
      if (!result?.success) {
        return {
          success: false,
          message: 'Failed to fetch user from auth service',
        };
      }

      const profilePicUrl = result.profilePictureUrl;
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: profilePicUrl,
      });

      const downloadUrl = await getSignedUrl(this.s3, command, {
        expiresIn: 300,
      });
      return { success: true, downloadUrl };
    } catch (error) {
      console.error('Error generating profile pic download URL:', error);
      return { success: false, message: error.message };
    }
  }

  async listGroupResources(groupId: string) {
    try {
      const result = await this.resourceRepo.find({
        where: { groupId },
        relations: ['tags'],
      });
      return {
        success: true,
        data: result,
        message: 'Resources fetched successfully',
      };
    } catch (error) {
      console.error('Error listing group resources:', error);
      return { success: false, message: 'Error listing group resources' };
    }
  }

  async deleteResource(resourceId: string) {
    const resource = await this.resourceRepo.findOne({ where: { resourceId } });

    if (!resource) return { success: false, message: 'Resource not found' };

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: resource.s3Key,
        }),
      );
    } catch (error) {
      console.error('Error deleting S3 object:', error);
      return { success: false, message: 'Error deleting S3 object' };
    }

    await this.resourceRepo.remove(resource);

    return { success: true, message: 'Resource deleted successfully' };
  }

  async getResourcesByGroupIds(groups: string[]) {
    try {
      if (!groups || !Array.isArray(groups) || groups.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No groups provided or empty groups array',
        };
      }

      const resources = await this.resourceRepo.find({
        where: { groupId: In(groups) },
        relations: ['tags'],
      });

      const filteredResources = resources.map((r) => {
        return {
          resourceId: r.resourceId,
          groupId: r.groupId,
          fileName: r.fileName,
          contentType: r.contentType,
          description: r.description,
          estimatedCompletionTime: r.estimatedCompletionTime,
          tags: r.tags,
        };
      });
      return {
        success: true,
        data: filteredResources,
        message: 'Resources fetched successfully',
      };
    } catch (error) {
      console.error('Error fetching resources by group IDs:', error);
      return {
        success: false,
        message: 'Error fetching resources by group IDs',
      };
    }
  }

  async deleteResourcesByGroupId(groupId: string) {
    try {
      const resources = await this.resourceRepo.find({ where: { groupId } });
      if (resources.length === 0) {
        return {
          success: true,
          message: 'No resources to delete for this group',
        };
      }

      const deletePromises = resources.map((resource) => {
        return this.s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: resource.s3Key,
          }),
        );
      });

      await Promise.all(deletePromises);
      await this.resourceRepo.remove(resources);

      return { success: true, message: 'Resources deleted successfully' };
    } catch (error) {
      console.error('Error deleting resources by group ID:', error);
      return {
        success: false,
        message: 'Error deleting resources by group ID',
      };
    }
  }
}
