import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { generateToken } from '../src/auth/jwt.js';
import { UserRole } from '../src/auth/roles.js';

describe('Real HTTP API Integration Test Suite with Supertest', () => {
  const app = createApp();

  const clientToken = generateToken({
    userId: 'user-client-http-1',
    role: UserRole.CLIENT,
    phone: '9876543210',
    clientProfileId: 'client-profile-http-1',
  });

  it('GET /health: should return 200 OK with X-Request-Id header', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('nirmaan-backend');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('POST /api/v1/auth/login: should validate phone number and OTP with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '123', otp: '12' });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/admin/workers/123/approve: should deny CLIENT role with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post('/api/v1/admin/workers/123/approve')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('FORBIDDEN');
  });

  it('POST /api/v1/admin/workers/123/approve: should deny unauthenticated request with 401 AUTH_REQUIRED', async () => {
    const res = await request(app)
      .post('/api/v1/admin/workers/123/approve')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.error?.code).toBe('AUTH_REQUIRED');
  });

  it('GET /api/v1/tools: should list all registered tools in the registry', async () => {
    const res = await request(app).get('/api/v1/tools');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(20);
  });

  it('POST /api/v1/tools/execute: should execute public search_workers tool', async () => {
    const res = await request(app)
      .post('/api/v1/tools/execute')
      .send({
        name: 'get_distance',
        arguments: {
          origin: { latitude: 28.6315, longitude: 77.2167 },
          destination: { latitude: 28.5708, longitude: 77.326 },
        },
        source: 'WEB',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.distanceKm).toBeGreaterThan(0);
  });

  it('POST /api/v1/ai/chat: should process location / route query and return natural language response', async () => {
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .send({
        message: 'plumber in Noida',
        language: 'hi',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.toolExecuted).toBe('search_workers');
  });
});
