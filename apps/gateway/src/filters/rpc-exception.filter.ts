// src/common/filters/rpc-exception.filter.ts

import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const error = exception.getError();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (typeof error === 'object' && error !== null && 'statusCode' in error && 'message' in error) {
      status = (error as any).statusCode;
      message = (error as any).message;

      // Handle the array of messages for validation errors
      if (Array.isArray(message)) {
        response.status(status).json({
          statusCode: status,
          message: 'Validation failed',
          errors: message, // Pass the array of error messages
        });
        return;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}