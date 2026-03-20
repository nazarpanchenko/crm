import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class MorganMiddleware implements NestMiddleware {
  private morganMiddleware: ReturnType<typeof morgan>;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.morganMiddleware = morgan(
      ':method :url :status :res[content-length] - :response-time ms',
      {
        stream: {
          write: (message: string) =>
            this.logger.http(message.trim(), { context: 'HTTP' }),
        },
      },
    );
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.morganMiddleware(req, res, next);
  }
}
