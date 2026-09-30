import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { toolManager } from '../../tools/manager.js';
import { toolRegistry } from '../../tools/registry.js';
import { ToolContext } from '../../tools/types.js';

export const toolRouter = Router();

// List all registered tools in the registry
toolRouter.get('/', (req: Request, res: Response) => {
  const tools = toolRegistry.list().map((t) => ({
    name: t.name,
    description: t.description,
    riskLevel: t.riskLevel,
    allowedRoles: t.allowedRoles,
    permissions: t.permissions,
    requireAuth: t.requireAuth,
  }));
  res.json({ success: true, data: tools, requestId: req.headers['x-request-id'] });
});

const executeSchema = z.object({
  name: z.string(),
  arguments: z.record(z.any()).default({}),
  source: z.enum(['WEB', 'VOICE', 'ADMIN']).default('WEB'),
});

// Execute any tool through the ToolManager pipeline
toolRouter.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, arguments: args, source } = executeSchema.parse(req.body);

    const context: ToolContext = {
      userId: req.user?.userId || null,
      role: req.user?.role || null,
      requestId: (req.headers['x-request-id'] as string) || 'unknown',
      source,
      ipAddress: req.ip,
      workerProfileId: req.user?.workerProfileId,
      clientProfileId: req.user?.clientProfileId,
    };

    const result = await toolManager.execute(name, args, context);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});
