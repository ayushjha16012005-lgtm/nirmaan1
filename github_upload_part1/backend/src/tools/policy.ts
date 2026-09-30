import { Tool, ToolContext, RiskLevel } from './types.js';
import { UserRole } from '../auth/roles.js';
import { ROLE_PERMISSIONS } from '../auth/permissions.js';
import { AppError, ErrorCode } from '../utils/errors.js';

export class ToolPolicy {
  public static async check(tool: Tool<any, any>, context: ToolContext): Promise<void> {
    const isPublicTool = tool.requireAuth === false || (tool.allowedRoles.length === 0 && tool.permissions.length === 0);

    // 1. Authentication check
    if (!isPublicTool && !context.userId) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, `Authentication required to execute tool: ${tool.name}`, 401);
    }

    // If user is authenticated, check roles and permissions
    if (context.userId && context.role) {
      // Admin bypasses specific role restrictions unless explicitly forbidden
      if (context.role !== UserRole.ADMIN && tool.allowedRoles.length > 0) {
        if (!tool.allowedRoles.includes(context.role)) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            `Role ${context.role} is not permitted to execute tool: ${tool.name}`,
            403
          );
        }
      }

      // Permission check
      if (tool.permissions.length > 0) {
        const userPermissions = ROLE_PERMISSIONS[context.role] || [];
        const hasAllPermissions = tool.permissions.every((p) => userPermissions.includes(p));
        if (!hasAllPermissions) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            `User lacks required permissions for tool: ${tool.name}`,
            403
          );
        }
      }
    }

    // 2. Risk check: High risk tools via voice require explicit verification
    if (tool.riskLevel === RiskLevel.HIGH && context.source === 'VOICE') {
      // High-risk tools via voice require ADMIN role and explicit authentication
      if (context.role !== UserRole.ADMIN) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          `High-risk action '${tool.name}' cannot be triggered without confirmed admin authorization`,
          403
        );
      }
    }
  }
}
