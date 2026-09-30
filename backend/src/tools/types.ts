import { z } from 'zod';
import { UserRole } from '../auth/roles.js';
import { Permission } from '../auth/permissions.js';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export type ToolSource = 'WEB' | 'VOICE' | 'ADMIN';

export interface ToolContext {
  userId: string | null;
  role: UserRole | null;
  requestId: string;
  source: ToolSource;
  ipAddress?: string;
  workerProfileId?: string;
  clientProfileId?: string;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

export interface Tool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  riskLevel: RiskLevel;
  allowedRoles: UserRole[];
  permissions: Permission[];
  requireAuth?: boolean;
  execute(input: TInput, context: ToolContext): Promise<TOutput>;
}
