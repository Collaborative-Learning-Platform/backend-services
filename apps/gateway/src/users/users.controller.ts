import { Body, Controller, Get, Inject, Put, Param } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USER_SERVICE') private readonly usersClient: ClientProxy,
  ) {}

  @Get('profile')
  getProfile(@Body() dto: any) {
    return this.usersClient.send({ cmd: 'get_profile' }, dto);
  }

  @Put('update-user/:id')
  async updateUserName(
    @Param('id') id: string,
    @Body() body: { name: string },
  ) {
    return this.usersClient.send(
      { cmd: 'update_user' },
      {
        updateUserDto: {
          id,
          name: body.name,
        },
      },
    );
  }
}
