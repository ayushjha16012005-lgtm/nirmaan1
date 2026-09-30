import { aiProvider, AIProvider } from './provider.js';
import { toolManager } from '../tools/manager.js';
import { toolRegistry } from '../tools/registry.js';
import { ToolContext } from '../tools/types.js';

export class AIAssistantService {
  private provider: AIProvider;

  constructor(provider: AIProvider = aiProvider) {
    this.provider = provider;
  }

  async handleUserQuery(
    message: string,
    context: ToolContext,
    language = 'hi'
  ) {
    // 1. Get Available Tool Definitions from Registry
    const tools = toolRegistry.list().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: {},
    }));

    // 2. AI extracts intent and selects tool
    const intent = await this.provider.interpretIntent(message, [], tools);

    if (!intent.toolName) {
      return {
        message: intent.message || 'I could not determine the appropriate action. Please try again.',
        toolResult: null,
      };
    }

    // 3. Tool Manager executes tool with full authorization and policy checks
    const toolResult = await toolManager.execute(
      intent.toolName,
      intent.arguments || {},
      context
    );

    // 4. AI generates natural language response from the real tool result
    let responseText = '';
    if (toolResult.success) {
      responseText = await this.provider.generateResponse(message, toolResult.data, language);
    } else {
      responseText = language === 'hi'
        ? `त्रुटि: ${toolResult.error?.message}`
        : `Error: ${toolResult.error?.message}`;
    }

    return {
      message: responseText,
      toolExecuted: intent.toolName,
      arguments: intent.arguments,
      toolResult,
    };
  }
}

export const aiAssistantService = new AIAssistantService();
