import { TranscriptionSegment } from '../../types/learningMaterial';
import { logger } from '../../configs/logger';

/**
 * Merges AI-generated insights with timing-based segments
 * @param timedSegments - Segments with accurate timing from speech recognition
 * @param aiSegments - Segments with AI-enhanced classification and context
 * @returns Enhanced segments with both timing and AI insights
 */
export const syncTime = (
  timedSegments: TranscriptionSegment[],
  aiSegments: TranscriptionSegment[]
): TranscriptionSegment[] => {
  logger.info(`🔄 Merging ${timedSegments.length} timed segments with ${aiSegments.length} AI segments`);
  
  // Strategy: Use AI segments as the authoritative source for text and classification,
  // then map timing information from the timed segments
  const mergedSegments: TranscriptionSegment[] = [];
  
  let currentTimedIndex = 0;
  
  aiSegments.forEach((aiSegment) => {
    
    // Map this position to timing information
    const timing = findTimingForText(aiSegment.text, timedSegments, currentTimedIndex);
    
    mergedSegments.push({
      text: aiSegment.text,
      startTime: timing.startTime,
      endTime: timing.endTime,
      segmentType: aiSegment.segmentType,
      speakerHint: aiSegment.speakerHint,
      contextNotes: aiSegment.contextNotes,
    });
    
    // Update tracking for next iteration
    currentTimedIndex = timing.lastUsedIndex;
  });
  
  logger.info(`✅ Merged into ${mergedSegments.length} final segments`);
  return mergedSegments;
};

/**
 * Finds appropriate timing for an AI segment text by matching with timed segments
 * @param aiText - Text from AI segment
 * @param timedSegments - Segments with timing information
 * @param startIndex - Index to start searching from
 * @returns Timing information and last used index
 */
const findTimingForText = (
  aiText: string,
  timedSegments: TranscriptionSegment[],
  startIndex: number
): { startTime: number; endTime: number; lastUsedIndex: number } => {
  const aiWords = aiText.toLowerCase().split(/\s+/);
  let bestMatch = { startTime: 0, endTime: 0, lastUsedIndex: startIndex };
  let matchedWords = 0;
  
  // Look for the best matching timed segment(s)
  for (let i = startIndex; i < timedSegments.length; i++) {
    const timedSegment = timedSegments[i];
    const timedWords = timedSegment.text.toLowerCase().split(/\s+/);
    
    // Calculate word overlap
    const overlap = calculateWordOverlap(aiWords, timedWords);
    
    if (overlap > matchedWords) {
      matchedWords = overlap;
      bestMatch = {
        startTime: timedSegment.startTime,
        endTime: timedSegment.endTime,
        lastUsedIndex: i,
      };
    }
    
    // If we found a good match (>50% words), use it
    if (overlap / aiWords.length > 0.5) {
      break;
    }
  }
  
  // If no good match found, interpolate timing
  if (matchedWords === 0 && timedSegments.length > 0) {
    const segmentIndex = Math.min(startIndex, timedSegments.length - 1);
    const segment = timedSegments[segmentIndex];
    bestMatch = {
      startTime: segment.startTime,
      endTime: segment.endTime,
      lastUsedIndex: segmentIndex,
    };
  }
  
  return bestMatch;
};

/**
 * Calculates word overlap between two text segments
 * @param words1 - First set of words
 * @param words2 - Second set of words
 * @returns Number of overlapping words
 */
const calculateWordOverlap = (words1: string[], words2: string[]): number => {
  let overlap = 0;
  const words2Set = new Set(words2);
  
  words1.forEach(word => {
    if (words2Set.has(word)) {
      overlap++;
    }
  });
  
  return overlap;
};