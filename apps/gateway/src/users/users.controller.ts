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

  @Get('preferences/:id')
  getPreferences(@Param('id') userID: string) {
    return this.usersClient.send({ cmd: 'get_preferences' }, { userID });
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

  // === Update preferences ===
  @Put('preferences/:id')
  updatePreferences(
    @Param('id') userID: string,
    @Body() updates: Record<string, any>,
  ) {
    return this.usersClient.send(
      { cmd: 'update_preferences' },
      { userID, updates },
    );
  }
}
