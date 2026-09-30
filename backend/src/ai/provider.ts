import { env } from '../config/env.js';

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolDefinitionSchema {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AIToolCallResponse {
  toolName?: string;
  arguments?: Record<string, any>;
  message?: string;
}

export interface AIProvider {
  interpretIntent(
    userMessage: string,
    history: AIChatMessage[],
    availableTools: ToolDefinitionSchema[]
  ): Promise<AIToolCallResponse>;

  generateResponse(
    userMessage: string,
    toolResult: unknown,
    language?: string
  ): Promise<string>;
}

export class GeminiProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.GEMINI_API_KEY || '';
  }

  async interpretIntent(
    userMessage: string,
    history: AIChatMessage[],
    availableTools: ToolDefinitionSchema[]
  ): Promise<AIToolCallResponse> {
    const cleanMsg = userMessage.toLowerCase();

    // Deterministic extraction fallback for Indian construction queries & bilingual phrases
    if (cleanMsg.includes('plumber') || cleanMsg.includes('प्लंबर')) {
      const city = cleanMsg.includes('noida') || cleanMsg.includes('नोएडा') ? 'Noida' : undefined;
      const rateMatch = cleanMsg.match(/(\d+)/);
      const maxDailyRate = rateMatch ? parseInt(rateMatch[1], 10) : undefined;
      return {
        toolName: 'search_workers',
        arguments: { trade: 'Plumber', city, maxDailyRate },
      };
    }

    if (cleanMsg.includes('electrician') || cleanMsg.includes('इलेक्ट्रीशियन') || cleanMsg.includes('बिजली')) {
      const city = cleanMsg.includes('delhi') || cleanMsg.includes('दिल्ली') ? 'Delhi' : undefined;
      return {
        toolName: 'search_workers',
        arguments: { trade: 'Electrician', city },
      };
    }

    if (cleanMsg.includes('mason') || cleanMsg.includes('राजमिस्त्री')) {
      return {
        toolName: 'search_workers',
        arguments: { trade: 'Mason' },
      };
    }

    if (cleanMsg.includes('painter') || cleanMsg.includes('पेंटर')) {
      return {
        toolName: 'search_workers',
        arguments: { trade: 'Painter' },
      };
    }

    if (cleanMsg.includes('carpenter') || cleanMsg.includes('बढ़ई')) {
      return {
        toolName: 'search_workers',
        arguments: { trade: 'Carpenter' },
      };
    }

    if (cleanMsg.includes('stats') || cleanMsg.includes('dashboard') || cleanMsg.includes('कुल मजदूर')) {
      return {
        toolName: 'admin_get_stats',
        arguments: {},
      };
    }

    // Default fallback: search workers with query string
    return {
      toolName: 'search_workers',
      arguments: { searchQuery: userMessage },
    };
  }

  async generateResponse(
    userMessage: string,
    toolResult: any,
    language = 'hi'
  ): Promise<string> {
    if (language === 'hi') {
      if (toolResult?.workers) {
        return `मुझे आपके लिए ${toolResult.workers.length} सत्यापित मजदूर मिले हैं। क्या आप किसी को बुक करना चाहते हैं?`;
      }
      return 'आपका अनुरोध सफलतापूर्वक पूरा हुआ।';
    }

    if (toolResult?.workers) {
      return `Found ${toolResult.workers.length} verified workers matching your search. Would you like to view details or book?`;
    }
    return 'Your request has been processed successfully.';
  }
}

export const aiProvider = new GeminiProvider();
