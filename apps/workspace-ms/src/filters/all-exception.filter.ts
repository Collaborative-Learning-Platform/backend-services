
import { Catch, ArgumentsHost, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    // const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';

    // Handle NestJS validation errors
    if (exception.response && exception.response.message) {
      message = exception.response.message;
    } else if (exception.message) {
      message = exception.message;
    }

    // Convert the exception to an RPCException
    // This allows the error to be sent over TCP
    const rpcException = new RpcException({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
    // console.log(rpcException)
    return rpcException;
  }
}