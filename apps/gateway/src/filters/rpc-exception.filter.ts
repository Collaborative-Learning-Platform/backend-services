import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const rpcError = exception.getError();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error from microservice';
    // console.log(rpcError)

    // Check if the RPC error payload is a structured object
    if (typeof rpcError === 'object' && rpcError !== null) {
      if ('statusCode' in rpcError && typeof (rpcError as any).statusCode === 'number') {
        status = (rpcError as any).statusCode;
      }
      if ('message' in rpcError) {
        message = (rpcError as any).message;
      }
    } else if (typeof rpcError === 'string') {
        // Handle cases where the RPC error is just a string
        message = rpcError;
    }

    // Handle validation errors (message is an array of strings)
    if (Array.isArray(message)) {
      response.status(status).json({
        statusCode: status,
        message: 'Validation failed',
        errors: message,
      });
      return;
    }

    // Send the final HTTP response to the client
    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}