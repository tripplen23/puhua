import { AzureChatOpenAI } from '@langchain/openai';

/**
 * AI Configuration for Puhua Finnish Learning App
 * Centralized configuration for all AI models and services
 */

export interface AIModelConfig {
  azureOpenAIApiKey: string;
  azureOpenAIApiInstanceName: string;
  azureOpenAIApiDeploymentName: string;
  azureOpenAIApiVersion: string;
  temperature: number;
  maxTokens: number;
  maxRetries: number;
}

export interface AIConfig {
  llm: AIModelConfig;
  // Future: embedding model config, other AI services
  // embedding?: EmbeddingModelConfig;
  // speechToText?: SpeechConfig;
}

/**
 * Validates that all required environment variables are present
 */
function validateEnvironmentVariables(): void {
  const requiredEnvVars = {
    AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_API_INSTANCE_NAME: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    AZURE_OPENAI_API_DEPLOYMENT_NAME: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Azure OpenAI environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all Azure OpenAI variables are set.'
    );
  }
}

/**
 * Default AI configuration
 */
export const getAIConfig = (): AIConfig => {
  validateEnvironmentVariables();
  
  return {
    llm: {
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY!,
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME!,
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
      temperature: 0.7,
      maxTokens: 6000,
      maxRetries: 3,
    }
  };
};

/**
 * Creates an Azure Chat OpenAI LLM instance with the given configuration
 * Uses Chat Completions API which is compatible with modern models like gpt-35-turbo, gpt-4, gpt-4o
 */
export const createLLM = (config?: Partial<AIModelConfig>): AzureChatOpenAI => {
  const aiConfig = getAIConfig();
  const finalConfig = { ...aiConfig.llm, ...config };

  return new AzureChatOpenAI({
    azureOpenAIApiKey: finalConfig.azureOpenAIApiKey,
    azureOpenAIApiInstanceName: finalConfig.azureOpenAIApiInstanceName,
    azureOpenAIApiDeploymentName: finalConfig.azureOpenAIApiDeploymentName,
    azureOpenAIApiVersion: finalConfig.azureOpenAIApiVersion,
    temperature: finalConfig.temperature,
    maxTokens: finalConfig.maxTokens,
    maxRetries: finalConfig.maxRetries,
  });
};

/**
 * Specialized LLM configurations for different tasks
 */
export const AIModelPresets = {
  finnishSegmentation: {
    temperature: 0.7,
    maxTokens: 6000,
  },

  healthCheck: {
    temperature: 0.1,
    maxTokens: 100,
  },
} as const;