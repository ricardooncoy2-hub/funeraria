import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const DEFAULT_CODE_BY_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDACION',
  [HttpStatus.UNAUTHORIZED]: 'NO_AUTENTICADO',
  [HttpStatus.FORBIDDEN]: 'NO_AUTORIZADO',
  [HttpStatus.NOT_FOUND]: 'NO_ENCONTRADO',
  [HttpStatus.CONFLICT]: 'CONFLICTO',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'REGLA_NEGOCIO',
  [HttpStatus.TOO_MANY_REQUESTS]: 'DEMASIADAS_SOLICITUDES',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'ERROR_INTERNO',
};

interface ErrorBody {
  code: string;
  message: string;
  details: unknown[];
  requestId: string | undefined;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ErrorBody = {
      code: DEFAULT_CODE_BY_STATUS[status] ?? 'ERROR',
      message: 'Ha ocurrido un error inesperado.',
      details: [],
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        body.message = payload;
      } else if (typeof payload === 'object' && payload !== null) {
        const p = payload as Record<string, unknown>;
        if (typeof p.code === 'string') body.code = p.code;
        if (Array.isArray(p.message)) {
          body.message = 'Error de validación.';
          body.details = p.message;
        } else if (typeof p.message === 'string') {
          body.message = p.message;
        }
        if (Array.isArray(p.details)) body.details = p.details;
      }
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({ error: body });
  }
}
