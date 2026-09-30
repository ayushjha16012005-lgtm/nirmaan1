import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiAssistantService } from '../../ai/assistant.js';
import { voiceService } from '../../voice/voice.service.js';
import { ToolContext } from '../../tools/types.js';

export const aiRouter = Router();

const chatSchema = z.object({
  message: z.string().min(1),
  language: z.string().optional(),
});

aiRouter.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, language } = chatSchema.parse(req.body);

    const context: ToolContext = {
      userId: req.user?.userId || null,
      role: req.user?.role || null,
      requestId: (req.headers['x-request-id'] as string) || 'unknown',
      source: 'WEB',
      ipAddress: req.ip,
      workerProfileId: req.user?.workerProfileId,
      clientProfileId: req.user?.clientProfileId,
    };

    const result = await aiAssistantService.handleUserQuery(message, context, language || 'hi');
    res.json({ success: true, data: result, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

const voiceSchema = z.object({
  transcript: z.string().min(1),
  language: z.string().optional(),
});

aiRouter.post('/voice', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transcript, language } = voiceSchema.parse(req.body);

    const context: ToolContext = {
      userId: req.user?.userId || null,
      role: req.user?.role || null,
      requestId: (req.headers['x-request-id'] as string) || 'unknown',
      source: 'VOICE',
      ipAddress: req.ip,
      workerProfileId: req.user?.workerProfileId,
      clientProfileId: req.user?.clientProfileId,
    };

    const result = await voiceService.processVoiceInput(
      transcript,
      context,
      language as any
    );
    res.json({ success: true, data: result, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});
