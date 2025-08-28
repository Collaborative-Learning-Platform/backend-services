import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity'; 
import * as fs from 'fs';
import * as path from 'path';
import { JwtModule } from '@nestjs/jwt';
import { RefreshToken } from './entity/refreshToken.entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'learni-theekshana-test.g.aivencloud.com',
      port: 10855,
      username: 'avnadmin',
      password: 'AVNS_5owkLIf6H1Lt3LARpFp',
      database: 'defaultdb',
      entities: [User,RefreshToken],
      synchronize: true,
      ssl: {
        // ca: fs.readFileSync(path.resolve(process.cwd(), 'env', 'aiven-ca.crt')).toString(),
        rejectUnauthorized: false,
      },
    }),
    TypeOrmModule.forFeature([
      User,
      RefreshToken
    ]),
    JwtModule.register({
      secret: 'your_jwt_secret', 
      signOptions: { expiresIn: '1h' }, 
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
