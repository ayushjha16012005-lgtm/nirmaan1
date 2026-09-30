import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from '../src/tools/registry.js';
import { ToolManager } from '../src/tools/manager.js';
import { Tool, RiskLevel, ToolContext } from '../src/tools/types.js';
import { UserRole } from '../src/auth/roles.js';
import { Permission } from '../src/auth/permissions.js';

describe('Tool Registry', () => {
  const registry = ToolRegistry.getInstance();

  beforeEach(() => {
    registry.clear();
  });

  const mockTool: Tool<{ message: string }, { echo: string }> = {
    name: 'test_echo',
    description: 'Echo test tool',
    riskLevel: RiskLevel.LOW,
    allowedRoles: [],
    permissions: [],
    requireAuth: false,
    inputSchema: z.object({ message: z.string() }),
    async execute(input) {
      return { echo: input.message };
    },
  };

  it('should register and retrieve a tool', () => {
    registry.register(mockTool);
    expect(registry.has('test_echo')).toBe(true);
    expect(registry.get('test_echo')).toBe(mockTool);
  });

  it('should throw an error on duplicate tool registration', () => {
    registry.register(mockTool);
    expect(() => registry.register(mockTool)).toThrowError(/already registered/);
  });

  it('should list all registered tools', () => {
    registry.register(mockTool);
    expect(registry.list()).toHaveLength(1);
    expect(registry.list()[0].name).toBe('test_echo');
  });
});

describe('Tool Manager & Policy Execution', () => {
  const registry = ToolRegistry.getInstance();
  const manager = ToolManager.getInstance();

  beforeEach(() => {
    registry.clear();
  });

  const publicTool: Tool<{ count: number }, { double: number }> = {
    name: 'public_doubler',
    description: 'Double numbers publicly',
    riskLevel: RiskLevel.LOW,
    allowedRoles: [],
    permissions: [],
    requireAuth: false,
    inputSchema: z.object({ count: z.number().min(0) }),
    async execute(input) {
      return { double: input.count * 2 };
    },
  };

  const adminOnlyTool: Tool<{ secretCode: string }, { authorized: boolean }> = {
    name: 'admin_danger_tool',
    description: 'High risk admin action',
    riskLevel: RiskLevel.HIGH,
    allowedRoles: [UserRole.ADMIN],
    permissions: [Permission.ADMIN_SUSPEND_USER],
    requireAuth: true,
    inputSchema: z.object({ secretCode: z.string() }),
    async execute(input) {
      return { authorized: true };
    },
  };

  it('should execute public tool without authentication', async () => {
    registry.register(publicTool);

    const context: ToolContext = {
      userId: null,
      role: null,
      requestId: 'test-req-1',
      source: 'WEB',
    };

    const result = await manager.execute('public_doubler', { count: 5 }, context);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ double: 10 });
    expect(result.requestId).toBe('test-req-1');
  });

  it('should fail with VALIDATION_ERROR when input schema is violated', async () => {
    registry.register(publicTool);

    const context: ToolContext = {
      userId: null,
      role: null,
      requestId: 'test-req-2',
      source: 'WEB',
    };

    const result = await manager.execute('public_doubler', { count: -10 }, context);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });

  it('should deny unauthorized user from executing admin-only tool', async () => {
    registry.register(adminOnlyTool);

    const context: ToolContext = {
      userId: 'user-client-1',
      role: UserRole.CLIENT,
      requestId: 'test-req-3',
      source: 'WEB',
    };

    const result = await manager.execute('admin_danger_tool', { secretCode: '123' }, context);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FORBIDDEN');
  });

  it('should deny unauthenticated user from executing protected tool', async () => {
    registry.register(adminOnlyTool);

    const context: ToolContext = {
      userId: null,
      role: null,
      requestId: 'test-req-4',
      source: 'WEB',
    };

    const result = await manager.execute('admin_danger_tool', { secretCode: '123' }, context);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('AUTH_REQUIRED');
  });

  it('should allow admin user to execute admin tool', async () => {
    registry.register(adminOnlyTool);

    const context: ToolContext = {
      userId: 'user-admin-1',
      role: UserRole.ADMIN,
      requestId: 'test-req-5',
      source: 'WEB',
    };

    const result = await manager.execute('admin_danger_tool', { secretCode: '123' }, context);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ authorized: true });
  });
});
