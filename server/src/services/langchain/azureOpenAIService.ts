import { logger } from '@azure/storage-blob';
import { createLLM, AIModelPresets } from '../../configs/aiConfig';
import { PromptRegistry } from './promptRegistry';

/**
 * Centralized Azure OpenAI service using LangChain
 * Provides a clean abstraction for all AI operations in the Puhua app
 * Uses centralized AI configuration from configs/aiConfig.ts
 */
export class AzureOpenAIService {

  /**
   * Generic method to invoke the LLM with a prompt template
   * Creates LLM instance on-demand using centralized configuration
   */
  async invokeWithPrompt(
    promptFactory: () => any,
    variables: Record<string, any>,
    modelConfig?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const llm = createLLM(modelConfig);
    const promptTemplate = promptFactory();
    const chain = promptTemplate.pipe(llm);
    return await chain.invoke(variables);
  }

  /**
   * Specialized method for Finnish language learning content segmentation
   * Uses optimized model configuration for segmentation tasks
   */
  async segmentFinnishTranscription(
    fullTranscription: string,
  ): Promise<string> {
    return await this.invokeWithPrompt(
      PromptRegistry.finnishSegmentation,
      {
        fullTranscription,
      },
      AIModelPresets.finnishSegmentation
    );
  }

  /**
   * Health check method to verify the service is working
   * Uses minimal configuration for quick validation
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.invokeWithPrompt(
        PromptRegistry.healthCheck,
        {},
        AIModelPresets.healthCheck
      );
      return response.toLowerCase().includes('ok');
    } catch (error) {
      logger.error('Azure OpenAI health check failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const azureOpenAIService = new AzureOpenAIService();