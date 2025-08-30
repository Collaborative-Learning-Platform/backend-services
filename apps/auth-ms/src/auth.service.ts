import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { In, Repository, MoreThan } from 'typeorm';
import * as csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entity/refreshToken.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(RefreshToken) private refreshTokenRepository: Repository<RefreshToken>,
    @Inject(JwtService)
    private jwtService: JwtService,
  ) {}

  async validateUser(credentials: LoginDto) {

    // console.log(credentials)
    const user = await this.userRepository.findOne({ where: { email: credentials.email } });

    console.log(user)

    if (!user) {
      throw new BadRequestException("User not found");
    }

    const isMatched = await bcrypt.compare(credentials.password, user.hashed_password);
    if (!isMatched) {
     throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = await this.generateToken(user.id);


    return{
      ...tokens,
      role:user.role,
      id:user.id
    }
  }




  async generateToken (userId:string){
    const access_token = this.jwtService.sign({userId:userId})

    const refresh_token = uuidv4();

    await this.storeRefreshToken(userId,refresh_token)

    return {access_token,refresh_token}

  }

  async storeRefreshToken (userId:string,refresh_token:string){
    const existingRefreshToken = await this.refreshTokenRepository.findOne({ where: { userId: userId } });
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    if (existingRefreshToken) {
      existingRefreshToken.refresh_token = refresh_token;
      existingRefreshToken.expiresAt = expiresAt;
    }else{
      await this.refreshTokenRepository.save({ userId: userId, refresh_token: refresh_token, expiresAt: expiresAt });
    }
  }



  async refreshToken (token:string){

    const refreshToken = await this.refreshTokenRepository.findOne({ where: { refresh_token: token, expiresAt: MoreThan(new Date()) } });
    
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateToken(refreshToken.userId);

  }












  async processFileAndCreateUsers(fileData: { originalname: string; buffer: Buffer }) {
    
    let users: any[] = [];

    if (fileData.originalname.endsWith('.csv')) {
      users = await this.parseCsv(fileData.buffer);
    } else if (fileData.originalname.endsWith('.xlsx')) {
      users = this.parseExcel(fileData.buffer);
    } else {
      throw new Error('Unsupported file format');
    }

    console.log('Parsed users:', users); 
    // Prepare users (e.g., hash passwords)
    const preparedUsers = await Promise.all(
      users.map(async (u) => ({
        ...u,
        hashed_password: await bcrypt.hash(u.password, 10),
        password: undefined,
      }))
    );

    // Bulk insert into DB
    // await this.userRepository
    //   .createQueryBuilder()
    //   .insert()
    //   .into(User)
    //   .values(preparedUsers)
    //   .execute();

    await this.userRepository.save(preparedUsers);

    return { message: 'Bulk registration successful', count: preparedUsers.length };
  }


  private parseCsv(fileBuffer: Buffer): Promise<any[]> {
  const results: any[] = [];

  // Make sure it's actually a Buffer
  if (!Buffer.isBuffer(fileBuffer)) {
    throw new Error("Expected fileBuffer to be a Buffer");
  }

  const stream = new Readable();
  stream.push(fileBuffer.toString()); // convert Buffer to string for CSV parser
  stream.push(null); // End of stream

  return new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}


  private parseExcel(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }


  
}

