import { languageDetector, IndianLanguage } from './language.js';
import { aiAssistantService } from '../ai/assistant.js';
import { ToolContext } from '../tools/types.js';

export class VoiceService {
  async processVoiceInput(
    transcript: string,
    context: ToolContext,
    userPreferredLang?: IndianLanguage
  ) {
    const detectedLang = userPreferredLang || languageDetector.detectLanguage(transcript);

    // Context must be marked as VOICE source for safety enforcement
    const voiceContext: ToolContext = {
      ...context,
      source: 'VOICE',
    };

    const aiResult = await aiAssistantService.handleUserQuery(
      transcript,
      voiceContext,
      detectedLang
    );

    return {
      transcript,
      language: detectedLang,
      aiResult,
    };
  }
}

export const voiceService = new VoiceService();
