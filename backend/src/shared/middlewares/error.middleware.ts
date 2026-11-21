import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('[Backend Error]:', err);
  const status = err.status || 500;
  const isProd = ENV.NODE_ENV === 'production';
  const message =
    isProd && (!err.isOperational || status >= 500)
      ? 'Error interno del servidor'
      : err.message || 'Internal Server Error';

  res.status(status).json({
    ok: false,
    error: message,
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
