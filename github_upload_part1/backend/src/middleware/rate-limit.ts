import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../utils/errors.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function rateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const store = new Map<string, RateLimitRecord>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown-client';
    const now = Date.now();

    const record = store.get(key);

    if (!record || now > record.resetTime) {
      store.set(key, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    if (record.count >= options.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      throw new AppError(
        ErrorCode.RATE_LIMITED,
        options.message || `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        429
      );
    }

    record.count += 1;
    next();
  };
}
