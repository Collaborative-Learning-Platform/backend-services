import { S3Client } from "@aws-sdk/client-s3";
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.storage-ms.env' });
dotenv.config({ path: process.cwd() + '/env/.common.env' });

export const S3Provider = {
  provide: 'S3_CLIENT',
  useFactory: () => {
    return new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  },
};
