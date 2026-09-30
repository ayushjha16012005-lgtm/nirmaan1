import { ZodError } from 'zod';
import { toolRegistry } from './registry.js';
import { ToolContext, ToolResult } from './types.js';
import { ToolPolicy } from './policy.js';
import { AppError, ErrorCode } from '../utils/errors.js';

export class ToolManager {
  private static instance: ToolManager;

  private constructor() {}

  public static getInstance(): ToolManager {
    if (!ToolManager.instance) {
      ToolManager.instance = new ToolManager();
    }
    return ToolManager.instance;
  }

  public async execute<TInput = any, TOutput = any>(
    toolName: string,
    input: TInput,
    context: ToolContext
  ): Promise<ToolResult<TOutput>> {
    const requestId = context.requestId;

    try {
      const tool = toolRegistry.get(toolName);

      if (!tool) {
        throw new AppError(
          ErrorCode.TOOL_NOT_FOUND,
          `Tool '${toolName}' not found in registry`,
          404
        );
      }

      // 1. Validate Input Schema
      const validatedInput = tool.inputSchema.parse(input);

      // 2. Enforce Policy (Auth, Roles, Permissions, Risk)
      await ToolPolicy.check(tool, context);

      // 3. Execute Tool
      const data = await tool.execute(validatedInput, context);

      return {
        success: true,
        data,
        requestId,
      };
    } catch (err: any) {
      if (err instanceof AppError) {
        return {
          success: false,
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
          requestId,
        };
      }

      if (err instanceof ZodError) {
        return {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Invalid tool arguments',
            details: err.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
          requestId,
        };
      }

      console.error(`[Tool Execution Error] [${toolName}] [Req: ${requestId}]:`, err);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: err.message || 'Tool execution encountered an internal error',
        },
        requestId,
      };
    }
  }
}

export const toolManager = ToolManager.getInstance();
