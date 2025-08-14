import { azureOpenAIService } from '../langchain/azureOpenAIService';
import { logger } from '../../configs/logger';
import { TranscriptionSegment } from '../../types/learningMaterial';

export interface SegmentationResult {
  transcriptionSegments: TranscriptionSegment[];
  segmentCount: number;
}

/**
 * Uses AI to intelligently segment transcription for optimal language learning
 * @param fullTranscription - Complete transcribed text
 * @returns Optimized segments for shadowing practice
 */
export const segmentTranscriptionForLearning = async (
  fullTranscription: string
): Promise<SegmentationResult> => {
  
  logger.info('🤖 Starting AI-powered transcription segmentation...');
  logger.info(`📝 Full transcription: ${fullTranscription}`);

  try {
    // Use the centralized LangChain service for segmentation
    const aiResponse = await azureOpenAIService.segmentFinnishTranscription(
      fullTranscription
    );
    logger.info('🤖 AI segmentation response received');

    // Parse the AI response
    let parsedResponse;
    try {
      // Handle different response formats from AzureChatOpenAI
      let responseText: string;
      
      if (typeof aiResponse === 'string') {
        responseText = aiResponse;
      } else if (aiResponse && typeof aiResponse === 'object' && 'content' in (aiResponse as any)) {
        responseText = (aiResponse as any).content;
      } else if (aiResponse && typeof aiResponse === 'object' && 'text' in (aiResponse as any)) {
        responseText = (aiResponse as any).text;
      } else {
        responseText = String(aiResponse);
      }
      
      logger.info('Response text:', responseText);
      
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      logger.error('❌ Failed to parse AI response:', parseError);
      logger.info('Raw AI response:', aiResponse);
      logger.info('AI response type:', typeof aiResponse);
      
      throw parseError;
    }

    // Process AI-generated segments
    const transcriptionSegments: TranscriptionSegment[] = parsedResponse.segments || [];

    logger.info(`✅ AI segmentation completed: ${transcriptionSegments.length} transcription segments`);
    
    return {
      transcriptionSegments,
      segmentCount: transcriptionSegments.length,
    };

  } catch (error) {
    logger.error('❌ AI segmentation failed:', error);
    throw error;
  }
};