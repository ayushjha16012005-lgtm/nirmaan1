import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Nirmaan Backend listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`📡 Health check available at: http://localhost:${env.PORT}/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
