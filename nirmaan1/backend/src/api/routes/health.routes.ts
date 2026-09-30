import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (req: Request, res: Response) => {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  res.json({
    status: 'ok',
    service: 'nirmaan-backend',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    requestId,
  });
});
