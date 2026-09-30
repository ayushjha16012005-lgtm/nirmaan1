import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserRole } from './roles.js';

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  phone: string;
  workerProfileId?: string;
  clientProfileId?: string;
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}
