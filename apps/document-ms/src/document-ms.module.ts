import { Module } from '@nestjs/common';
import { DocumentMsController } from './document-ms.controller';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.common.env' });
import { DocumentMsService } from './document-ms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from 'apps/workspace-ms/src/entity/group.entity';
import { Document } from './entity/document.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Document],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    TypeOrmModule.forFeature([Document]),
  ],
  controllers: [DocumentMsController],
  providers: [DocumentMsService],
})
export class DocumentMsModule {}
