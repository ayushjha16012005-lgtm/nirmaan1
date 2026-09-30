import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthTokenPayload } from '../auth/jwt.js';
import { UserRole } from '../auth/roles.js';
import { Permission, ROLE_PERMISSIONS } from '../auth/permissions.js';
import { AppError, ErrorCode } from '../utils/errors.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    // If token is invalid or expired, continue without req.user
    next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication is required for this operation', 401);
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication is required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        `Role ${req.user.role} is not authorized for this resource`,
        403
      );
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Authentication is required', 401);
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(permission)) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        `Missing required permission: ${permission}`,
        403
      );
    }

    next();
  };
}
