import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

export interface McpJsonRpcError {
  code: string;
  message: string;
}

@Catch()
export class McpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();

    const payload: McpJsonRpcError = {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    };

    if (exception instanceof Error) {
      if (exception.message === 'AUTH_FAILED') {
        payload.code = 'AUTH_FAILED';
        payload.message = 'Authentication failed';
      } else if (exception.message === 'CIRCUIT_OPEN') {
        payload.code = 'AUTH_SERVICE_UNAVAILABLE';
        payload.message = 'Authentication service unavailable';
      } else if (exception.message === 'CEDAR_CIRCUIT_OPEN') {
        payload.code = 'AUTHORIZATION_SERVICE_UNAVAILABLE';
        payload.message = 'Authorization service unavailable';
      }
    }

    response.status(200).json({ jsonrpc: '2.0', error: payload, id: null });
  }
}
