import { NestFactory } from '@nestjs/core';
import { AnalyticsMsModule } from './analytics-ms.module';

async function bootstrap() {
  const app = await NestFactory.create(AnalyticsMsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
