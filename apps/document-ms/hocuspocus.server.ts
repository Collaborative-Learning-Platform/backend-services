import { Server } from '@hocuspocus/server';
import { Redis } from '@hocuspocus/extension-redis';
import * as dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/env/.common.env' });
dotenv.config({ path: process.cwd() + '/env/.document-ms.env' });
// import * as Y from 'yjs';
import { DataSource } from 'typeorm';
import { Database } from '@hocuspocus/extension-database';
import { Document } from './src/entity/document.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Document],
  synchronize: true, // migrations instead in prod
  ssl: {
    rejectUnauthorized: false, // for cloud providers
  },
  logging: false,
});

export async function setUpDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Data Source has been initialized!');
    }
    return AppDataSource;
  } catch (err) {
    console.error('Error during Data Source initialization:', err);
    throw err;
  }
}

async function bootstrap() {
  const db = await setUpDatabase();

  const server = new Server({
    port: 1234,
    extensions: [
      //   new Redis({
      //     host: process.env.REDIS_HOST || 'localhost',
      //     port: Number(process.env.REDIS_PORT),
      //   }),
      new Database({
        fetch: async ({ documentName }) => {
          const repo = AppDataSource.getRepository(Document);
          const doc = await repo.findOneBy({ name: documentName });
          if (!doc) {
            throw new Error(`Document ${documentName} not found`);
          }

          return doc.data ?? null;
        },
        store: async ({ documentName, state }) => {
          const repo = AppDataSource.getRepository(Document);
          let doc = await repo.findOneBy({ name: documentName });
          if (!doc) {
            throw new Error(
              `Cannot store state: document ${documentName} not found`,
            );
          } else {
            doc.data = Buffer.from(state);
          }
          await repo.save(doc);
        },
      }),
    ],
  });

  server.listen();
  console.log(`Hocuspocus server running on ws://localhost:1234`);
}

bootstrap().catch((err) => {
  console.error('Failed to start Hocuspocus server:', err);
});
