import { Controller, Post } from '@nestjs/common';


@Controller('workspace')
export class WorkspaceController {

    @Post('test')
    async test() {
        return { message: 'Workspace test successful' };
    }

}
