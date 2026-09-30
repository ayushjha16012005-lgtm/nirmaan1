import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken } from '../src/auth/jwt.js';
import { UserRole } from '../src/auth/roles.js';

describe('Authentication & JWT Security Hardening', () => {
  const validPayload = {
    userId: 'user-uuid-1234',
    role: UserRole.CLIENT,
    phone: '9876543210',
    clientProfileId: 'client-uuid-5678',
  };

  it('should successfully generate and verify a valid JWT token', () => {
    const token = generateToken(validPayload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(validPayload.userId);
    expect(decoded.role).toBe(UserRole.CLIENT);
  });

  it('should reject a tampered JWT token with invalid signature', () => {
    const token = generateToken(validPayload);
    const tamperedToken = token.slice(0, -5) + 'AAAAA';
    expect(() => verifyToken(tamperedToken)).toThrow();
  });

  it('should reject an expired token', () => {
    const expiredToken = jwt.sign(
      validPayload,
      process.env.JWT_SECRET || 'nirmaan-dev-secret-change-in-production-2026',
      { expiresIn: '-1s' }
    );
    expect(() => verifyToken(expiredToken)).toThrow();
  });

  it('should reject a token signed with a malicious secret', () => {
    const forgedToken = jwt.sign(validPayload, 'malicious-attacker-secret', {
      expiresIn: '1h',
    });
    expect(() => verifyToken(forgedToken)).toThrow();
  });

  it('should reject garbage/malformed strings', () => {
    expect(() => verifyToken('not.a.real.token')).toThrow();
    expect(() => verifyToken('')).toThrow();
  });
});
