import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { requestIdMiddleware } from './middleware/request-id.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimiter } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './api/routes/health.routes.js';
import { authRouter } from './api/routes/auth.routes.js';
import { workerRouter } from './api/routes/worker.routes.js';
import { bookingRouter } from './api/routes/booking.routes.js';
import { jobRouter } from './api/routes/job.routes.js';
import { reviewRouter } from './api/routes/review.routes.js';
import { locationRouter } from './api/routes/location.routes.js';
import { notificationRouter } from './api/routes/notification.routes.js';
import { adminRouter } from './api/routes/admin.routes.js';
import { aiRouter } from './api/routes/ai.routes.js';
import { toolRouter } from './api/routes/tool.routes.js';
import { registerAllTools } from './tools/index.js';
import { env } from './config/env.js';

export function createApp(): Express {
  // 1. Initialize Tool Registry
  registerAllTools();

  const app = express();

  // 2. Security & Observability Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // 3. Request ID & Authentication Middleware
  app.use(requestIdMiddleware);
  app.use(authMiddleware);

  // 4. Rate Limiting for sensitive routes
  const authLimiter = rateLimiter({ windowMs: 60 * 1000, maxRequests: 20, message: 'Too many authentication attempts' });
  const aiLimiter = rateLimiter({ windowMs: 60 * 1000, maxRequests: 30, message: 'AI query rate limit exceeded' });

  // 5. API Routes
  app.use('/', healthRouter);
  app.use('/api/v1', healthRouter);
  app.use('/api/v1/auth', authLimiter, authRouter);
  app.use('/api/v1/workers', workerRouter);
  app.use('/api/v1/bookings', bookingRouter);
  app.use('/api/v1/jobs', jobRouter);
  app.use('/api/v1/reviews', reviewRouter);
  app.use('/api/v1/location', locationRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/ai', aiLimiter, aiRouter);
  app.use('/api/v1/tools', toolRouter);

  // 6. 404 Handler for Unknown Routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Cannot ${req.method} ${req.path}`,
      },
      requestId: req.headers['x-request-id'],
    });
  });

  // 7. Centralized Error Handling
  app.use(errorHandler);

  return app;
}
