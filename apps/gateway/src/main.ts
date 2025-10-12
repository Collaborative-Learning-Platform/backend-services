// apps/gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import * as cookieparser from 'cookie-parser';
import { RpcExceptionFilter } from './filters/rpc-exception.filter';


async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  app.use(cookieparser())
  
  app.enableCors({
    origin: ['https://learniedu.vercel.app', 'http://localhost:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
    
  });

  app.useGlobalFilters(new RpcExceptionFilter())

  await app.listen(3000,'0.0.0.0');
  console.log('API Gateway is running at http://localhost:3000');
}
bootstrap();
