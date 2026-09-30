import { Tool } from './types.js';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools = new Map<string, Tool<any, any>>();

  private constructor() {}

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  public register(tool: Tool<any, any>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  public get(name: string): Tool<any, any> | undefined {
    return this.tools.get(name);
  }

  public list(): Tool<any, any>[] {
    return Array.from(this.tools.values());
  }

  public has(name: string): boolean {
    return this.tools.has(name);
  }

  public clear(): void {
    this.tools.clear();
  }
}

export const toolRegistry = ToolRegistry.getInstance();
