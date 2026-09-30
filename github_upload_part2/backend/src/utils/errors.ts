export enum ErrorCode {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  WORKER_NOT_APPROVED = 'WORKER_NOT_APPROVED',
  WORKER_UNAVAILABLE = 'WORKER_UNAVAILABLE',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  DUPLICATE_APPLICATION = 'DUPLICATE_APPLICATION',
  RESOURCE_NOT_OWNED = 'RESOURCE_NOT_OWNED',
  RATE_LIMITED = 'RATE_LIMITED',
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, code = ErrorCode.VALIDATION_ERROR, details?: unknown) {
    return new AppError(code, message, 400, details);
  }

  static unauthorized(message = 'Authentication required', code = ErrorCode.AUTH_REQUIRED) {
    return new AppError(code, message, 401);
  }

  static forbidden(message = 'Access forbidden', code = ErrorCode.FORBIDDEN) {
    return new AppError(code, message, 403);
  }

  static notFound(message = 'Resource not found', code = ErrorCode.NOT_FOUND) {
    return new AppError(code, message, 404);
  }

  static conflict(message: string, code = ErrorCode.BOOKING_CONFLICT) {
    return new AppError(code, message, 409);
  }

  static internal(message = 'Internal server error', code = ErrorCode.INTERNAL_ERROR) {
    return new AppError(code, message, 500);
  }
}
