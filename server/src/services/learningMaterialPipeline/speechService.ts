import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { azureSpeechConfig } from '../../configs/azureSpeechConfig';
import { logger } from '../../configs/logger';

export interface SpeechToTextResult {
  transcription: string;
  language: string;
  duration: number;
}

/**
 * Sends audio buffer to Azure Speech-to-Text API for transcription
 * @param audioBuffer - WAV audio buffer (16kHz, mono, PCM)
 * @param language - Language code (default: 'fi-FI' for Finnish)
 * @returns Promise with transcription results
 */
export const transcribeAudio = async (
  audioBuffer: Buffer,
  language: string = 'fi-FI'
): Promise<SpeechToTextResult> => {
  return new Promise((resolve, reject) => {
    try {
      logger.info('🎤 Starting speech-to-text transcription...');
      
      // Create speech config
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        azureSpeechConfig.key,
        azureSpeechConfig.region
      );
      
      // Set recognition language
      speechConfig.speechRecognitionLanguage = language;
      
      // Create audio config from buffer
      const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
      
      // Create speech recognizer
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
      
      let fullTranscription = '';
      let totalDuration = 0;
      
      // Handle recognition results
      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) {
          logger.info(`✅ Recognized: ${e.result.text}`);
          fullTranscription += (fullTranscription ? ' ' : '') + e.result.text;
          
          // Calculate duration from offset + duration (convert from ticks to seconds)
          const segmentEndTime = (e.result.offset + e.result.duration) / 10000000;
          if (segmentEndTime > totalDuration) {
            totalDuration = segmentEndTime;
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
          logger.info('📝 Transcription completed');
          recognizer.close();
          resolve({
            transcription: fullTranscription.trim(),
            language,
            duration: totalDuration,
          });
        }
      };
      
      // Handle session stopped (normal completion)
      recognizer.sessionStopped = (s, e) => {
        logger.info('🛑 Recognition session stopped');
        recognizer.close();
        resolve({
          transcription: fullTranscription.trim(),
          language,
          duration: totalDuration,
        });
      };
      
      // Start continuous recognition
      recognizer.startContinuousRecognitionAsync(
        () => {
          logger.info('✅ Speech recognition started');
        },
        (error) => {
          logger.error('❌ Failed to start recognition:', error);
          recognizer.close();
          reject(new Error(`Failed to start speech recognition: ${error}`));
        }
      );
      
    } catch (error) {
      logger.error('❌ Speech service error:', error);
      reject(new Error(`Speech service initialization failed: ${error}`));
    }
  });
};

/**
 * Helper function to validate audio format for Azure Speech Service
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