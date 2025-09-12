import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

interface HttpExceptionResponse {
  message: string | string[];
  error?: string;
  code?: string;
  details?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as HttpExceptionResponse;
        message = Array.isArray(responseObj.message)
          ? 'Validation failed'
          : responseObj.message || responseObj.error || 'An error occurred';
        details = Array.isArray(responseObj.message)
          ? responseObj.message
          : responseObj.details;
      } else {
        message = 'An error occurred';
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';

      const errorMessage =
        exception instanceof Error ? exception.message : String(exception);
      this.logger.error(
        `Unexpected error: ${errorMessage}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const apiResponse: ApiResponse = {
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (details) {
      apiResponse.details = details;
    }

    // Log the error for monitoring
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      JSON.stringify(apiResponse),
    );

    response.status(status).json(apiResponse);
  }
}
