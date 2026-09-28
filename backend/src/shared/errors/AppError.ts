export class AppError extends Error {
  public readonly status: number;
  public readonly isOperational: boolean;

  constructor(message: string, status: number = 500, isOperational: boolean = true) {
    super(message);
    this.status = status;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static unauthorized(message: string = 'No autorizado'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message: string = 'Acceso denegado'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message: string = 'Recurso no encontrado'): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static internal(message: string = 'Error interno del servidor'): AppError {
    return new AppError(message, 500);
  }
}
