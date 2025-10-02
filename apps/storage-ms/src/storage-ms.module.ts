import { Module } from '@nestjs/common';
import { StorageMsController } from './storage-ms.controller';
import { StorageMsService } from './storage-ms.service';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.storage-ms.env' });
dotenv.config({ path: process.cwd() + '/env/.common.env' });
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from './entity/resource.entity';
import { ResourceTag } from './entity/resourceTags.entity';
import { S3Provider } from '../providers/S3Provider';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Resource, ResourceTag],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false
      }
    }),
    TypeOrmModule.forFeature([Resource, ResourceTag]),
  ],
  controllers: [StorageMsController],
  providers: [StorageMsService,S3Provider],
})
export class StorageMsModule {}
