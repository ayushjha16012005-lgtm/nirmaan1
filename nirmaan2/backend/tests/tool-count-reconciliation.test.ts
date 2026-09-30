import { describe, it, expect, beforeEach } from 'vitest';
import { toolRegistry } from '../src/tools/registry.js';
import { registerAllTools } from '../src/tools/index.js';

describe('Tool Count & Registry Reconciliation Verification', () => {
  beforeEach(() => {
    toolRegistry.clear();
    registerAllTools();
  });

  it('should accurately count and register exactly 35 distinct production tools', () => {
    const tools = toolRegistry.list();
    expect(tools).toHaveLength(35);

    const names = tools.map((t) => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(35);
  });

  it('should verify every tool declares valid schema, risk level, and metadata', () => {
    const tools = toolRegistry.list();
    for (const tool of tools) {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(tool.riskLevel);
      expect(Array.isArray(tool.allowedRoles)).toBe(true);
      expect(Array.isArray(tool.permissions)).toBe(true);
      expect(typeof tool.execute).toBe('function');
    }
  });
});
