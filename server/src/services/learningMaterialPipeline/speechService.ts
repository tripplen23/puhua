import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { azureSpeechConfig } from '../../configs/azureSpeechConfig';
import { logger } from '../../configs/logger';
import { TranscriptionSegment } from '../../types/learningMaterial';

export interface DetailedSpeechResult {
  transcription: string;
  language: string;
  duration: number;
  segments: TranscriptionSegment[];
}

export interface TimedRecognitionResult {
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

/**
 * Enhanced speech-to-text with detailed timing information
 * Uses Azure Speech SDK's detailed result events to capture precise timestamps
 * @param audioBuffer - WAV audio buffer (16kHz, mono, PCM)
 * @param language - Language code (default: 'fi-FI' for Finnish)
 * @returns Promise with detailed transcription results including timing
 */
export const transcribeAudio = async (
  audioBuffer: Buffer,
  language: string = 'fi-FI'
): Promise<DetailedSpeechResult> => {
  return new Promise((resolve, reject) => {
    try {
      logger.info('🎤 Starting enhanced speech-to-text with timing...');
      
      // Create speech config
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        azureSpeechConfig.key,
        azureSpeechConfig.region
      );
      
      // Set recognition language
      speechConfig.speechRecognitionLanguage = language;
      
      // Enable detailed results for timing information
      speechConfig.requestWordLevelTimestamps();
      speechConfig.outputFormat = sdk.OutputFormat.Detailed;
      
      // Create audio config from buffer
      const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
      
      // Create speech recognizer
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      
      let fullTranscription = '';
      let totalDuration = 0;
      const timedResults: TimedRecognitionResult[] = [];
      
      // Handle recognition results with detailed timing
      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) {
          logger.info(`✅ Recognized: ${e.result.text}`);
          fullTranscription += (fullTranscription ? ' ' : '') + e.result.text;
          
          // Extract timing information (convert from ticks to seconds)
          const startTime = e.result.offset / 10000000;
          const duration = e.result.duration / 10000000;
          const endTime = startTime + duration;
          
          // Store timed result
          timedResults.push({
            text: e.result.text,
            startTime,
            endTime,
            confidence: 0.9, // Default confidence, can be enhanced with detailed results
          });
          
          if (endTime > totalDuration) {
            totalDuration = endTime;
          }
        } else if (e.result.reason === sdk.ResultReason.NoMatch) {
          logger.info('⚠️ No speech detected in this segment');
        }
      };
      
      // Handle cancellation
      recognizer.canceled = (s, e) => {
        logger.error(`❌ Recognition canceled: ${e.reason}`);
        if (e.reason === sdk.CancellationReason.Error) {
          logger.error(`Error details: ${e.errorDetails}`);
          recognizer.close();
          reject(new Error(`Speech recognition failed: ${e.errorDetails}`));
        } else {
          // Handle non-error cancellations as completion
          logger.info('📝 Enhanced transcription completed');
          recognizer.close();
          
          const segments = convertTimedResultsToSegments(timedResults);
          
          resolve({
            transcription: fullTranscription.trim(),
            language,
            duration: totalDuration,
            segments,
          });
        }
      };
      
      // Handle session stopped (normal completion)
      recognizer.sessionStopped = (s, e) => {
        logger.info('🛑 Enhanced recognition session stopped');
        recognizer.close();
        
        const segments = convertTimedResultsToSegments(timedResults);
        
        resolve({
          transcription: fullTranscription.trim(),
          language,
          duration: totalDuration,
          segments,
        });
      };
      
      // Start continuous recognition
      recognizer.startContinuousRecognitionAsync(
        () => {
          logger.info('✅ Enhanced speech recognition started');
        },
        (error) => {
          logger.error('❌ Failed to start enhanced recognition:', error);
          recognizer.close();
          reject(new Error(`Failed to start enhanced speech recognition: ${error}`));
        }
      );
      
    } catch (error) {
      logger.error('❌ Enhanced speech service error:', error);
      reject(new Error(`Enhanced speech service initialization failed: ${error}`));
    }
  });
};

/**
 * Converts timed recognition results to transcription segments
 * Creates smaller, more granular segments that preserve natural speech boundaries
 * @param timedResults - Array of timed recognition results
 * @returns Array of transcription segments
 */
const convertTimedResultsToSegments = (timedResults: TimedRecognitionResult[]): TranscriptionSegment[] => {
  if (timedResults.length === 0) {
    return [];
  }
  
  const segments: TranscriptionSegment[] = [];
  
  // Create individual segments for each recognition result to preserve granularity
  // This allows AI to better merge and split based on semantic understanding
  timedResults.forEach((result, index) => {
    // Split longer results by sentence boundaries to prevent over-merging
    const sentences = splitBySentenceBoundaries(result.text);
    
    if (sentences.length === 1) {
      // Single sentence/phrase - create one segment
      segments.push({
        text: result.text.trim(),
        startTime: result.startTime,
        endTime: result.endTime,
        segmentType: determineSegmentType(result.text.trim()),
        speakerHint: 'speaker1', // Default speaker, AI will refine
        contextNotes: '', // Will be filled by AI
      });
    } else {
      // Multiple sentences - split timing proportionally
      const totalDuration = result.endTime - result.startTime;
      let currentTime = result.startTime;
      
      sentences.forEach((sentence, sentIndex) => {
        const sentenceDuration = (sentence.length / result.text.length) * totalDuration;
        const segmentEndTime = currentTime + sentenceDuration;
        
        segments.push({
          text: sentence.trim(),
          startTime: currentTime,
          endTime: segmentEndTime,
          segmentType: determineSegmentType(sentence.trim()),
          speakerHint: 'speaker1',
          contextNotes: '',
        });
        
        currentTime = segmentEndTime;
      });
    }
  });
  
  logger.info(`📚 Created ${segments.length} granular segments from ${timedResults.length} recognition results`);
  
  return segments;
};

/**
 * Splits text by sentence boundaries while preserving Finnish language patterns
 * @param text - Text to split
 * @returns Array of sentences
 */
const splitBySentenceBoundaries = (text: string): string[] => {
  // Finnish sentence boundary patterns
  const sentences = text
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // If no clear sentence boundaries found, check for question patterns
  if (sentences.length === 1) {
    const questionSplit = text.split(/(\?)/);
    if (questionSplit.length > 1) {
      const result: string[] = [];
      for (let i = 0; i < questionSplit.length; i += 2) {
        if (questionSplit[i].trim()) {
          const sentence = questionSplit[i].trim() + (questionSplit[i + 1] || '');
          result.push(sentence);
        }
      }
      return result.length > 0 ? result : [text];
    }
  }
  
  return sentences.length > 0 ? sentences : [text];
};

/**
 * Basic segment type determination based on text patterns
 * This provides initial classification that can be refined by AI later
 * @param text - Segment text
 * @returns Segment type
 */
const determineSegmentType = (text: string): TranscriptionSegment['segmentType'] => {
  const lowerText = text.toLowerCase().trim();
  
  // Check for questions
  if (lowerText.includes('?') || 
      lowerText.startsWith('mikä') || 
      lowerText.startsWith('mitä') ||
      lowerText.startsWith('missä') ||
      lowerText.startsWith('milloin') ||
      lowerText.startsWith('miten')) {
    return 'question';
  }
  
  // Check for greetings
  if (lowerText.includes('hei') || 
      lowerText.includes('moi') ||
      lowerText.includes('terve') ||
      lowerText.includes('kiitos') ||
      lowerText.includes('näkemiin')) {
    return 'greeting';
  }
  
  // Check for dialogue markers
  if (lowerText.includes('sanoi') || 
      lowerText.includes('vastasi') ||
      lowerText.includes('kysyi')) {
    return 'dialogue';
  }
  
  // Default to sentence for longer texts, phrase for shorter
  return text.length > 50 ? 'sentence' : 'phrase';
};

/**
 * Helper function to validate audio format for enhanced Azure Speech Service
 * @param audioBuffer - Audio buffer to validate
 * @returns boolean indicating if format is valid
 */
export const validateAudioFormat = (audioBuffer: Buffer): boolean => {
  // Check if it's a WAV file (starts with RIFF header)
  if (audioBuffer.length < 44) {
    return false;
  }
  
  const riffHeader = audioBuffer.subarray(0, 4).toString('ascii');
  const waveHeader = audioBuffer.subarray(8, 12).toString('ascii');
  
  return riffHeader === 'RIFF' && waveHeader === 'WAVE';
};