import { Body, Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';


@Controller('users')
export class UsersController {
    constructor(@Inject ('USERS_SERVICE') private readonly usersClient: ClientProxy) {}

    @Get('profile')
    getProfile(@Body() dto: any) {
        return this.usersClient.send({ cmd: 'get_profile' }, dto);
    }


}
