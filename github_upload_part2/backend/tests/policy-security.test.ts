import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from '../src/tools/registry.js';
import { ToolManager } from '../src/tools/manager.js';
import { Tool, RiskLevel, ToolContext } from '../src/tools/types.js';
import { UserRole } from '../src/auth/roles.js';
import { Permission } from '../src/auth/permissions.js';

describe('Adversarial Role & Policy Security Audit', () => {
  const registry = ToolRegistry.getInstance();
  const manager = ToolManager.getInstance();

  beforeEach(() => {
    registry.clear();
  });

  const adminApproveTool: Tool<{ workerId: string }> = {
    name: 'approve_worker',
    description: 'Admin tool to approve worker',
    riskLevel: RiskLevel.HIGH,
    allowedRoles: [UserRole.ADMIN],
    permissions: [Permission.ADMIN_APPROVE_WORKER],
    requireAuth: true,
    inputSchema: z.object({ workerId: z.string() }),
    async execute() {
      return { approved: true };
    },
  };

  const clientBookingTool: Tool<{ workerId: string }> = {
    name: 'create_booking',
    description: 'Client creates booking',
    riskLevel: RiskLevel.MEDIUM,
    allowedRoles: [UserRole.CLIENT],
    permissions: [Permission.CREATE_BOOKING],
    requireAuth: true,
    inputSchema: z.object({ workerId: z.string() }),
    async execute() {
      return { booked: true };
    },
  };

  it('ATTACK: Client tries to execute admin approve_worker tool', async () => {
    registry.register(adminApproveTool);

    const attackerContext: ToolContext = {
      userId: 'client-attacker-id',
      role: UserRole.CLIENT,
      requestId: 'attack-req-1',
      source: 'WEB',
    };

    const result = await manager.execute('approve_worker', { workerId: 'worker-1' }, attackerContext);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FORBIDDEN');
  });

  it('ATTACK: Worker tries to execute admin approve_worker tool', async () => {
    registry.register(adminApproveTool);

    const attackerContext: ToolContext = {
      userId: 'worker-attacker-id',
      role: UserRole.WORKER,
      requestId: 'attack-req-2',
      source: 'WEB',
    };

    const result = await manager.execute('approve_worker', { workerId: 'worker-1' }, attackerContext);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FORBIDDEN');
  });

  it('ATTACK: Unauthenticated attacker attempts to book worker without session', async () => {
    registry.register(clientBookingTool);

    const unauthContext: ToolContext = {
      userId: null,
      role: null,
      requestId: 'attack-req-3',
      source: 'WEB',
    };

    const result = await manager.execute('create_booking', { workerId: 'worker-1' }, unauthContext);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('AUTH_REQUIRED');
  });

  it('ATTACK: Voice Assistant invocation for HIGH risk action with non-admin credentials', async () => {
    registry.register(adminApproveTool);

    const voiceContext: ToolContext = {
      userId: 'user-client-123',
      role: UserRole.CLIENT,
      requestId: 'voice-attack-1',
      source: 'VOICE',
    };

    const result = await manager.execute('approve_worker', { workerId: 'worker-1' }, voiceContext);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FORBIDDEN');
  });
});
