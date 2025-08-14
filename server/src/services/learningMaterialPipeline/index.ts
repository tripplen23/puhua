import { supabase } from '../../configs/dbConfig';
import ytdl from '@distube/ytdl-core';
import { v4 as uuidv4 } from 'uuid';
import { LearningMaterialRecord } from '../../types/learningMaterial';
import { streamToBuffer, extractAudioFromBuffer, uploadToBlob } from './helpers';
import { transcribeAudio, validateAudioFormat } from './speechService';
import { segmentTranscriptionForLearning } from './aiSegmentService';
import { logger } from '../../configs/logger';

// Main processing function
export const processYouTubeVideo = async (youtubeUrl: string): Promise<{
  id: string;
  videoUrl: string;
  audioUrl: string;
}> => {
  // Validate YouTube URL
  if (!ytdl.validateURL(youtubeUrl)) {
    throw new Error('Invalid YouTube URL provided');
  }
  
  const materialId = uuidv4();
  const timestamp = Date.now();
  const videoFilename = `${materialId}/video_${timestamp}.mp4`;
  const audioFilename = `${materialId}/audio_${timestamp}.wav`;
  
  try {
    // Step A: Input YouTube URL (already received)
    logger.info(`🎬 Processing YouTube video: ${youtubeUrl}`);
    
    // Step B: Extract audio from the YouTube video
    logger.info('📥 Downloading video stream...');
    const videoStream = ytdl(youtubeUrl, {
      quality: 'highest',
      filter: 'audioandvideo',
    });
    
    const videoBuffer = await streamToBuffer(videoStream);
    logger.info(`✅ Video downloaded: ${videoBuffer.length} bytes`);
    
    // Extract audio using system FFmpeg
    logger.info('🎵 Extracting and converting audio with FFmpeg...');
    
    const audioBuffer = await extractAudioFromBuffer(videoBuffer);
    logger.info(`✅ Audio extracted: ${audioBuffer.length} bytes`);
    
    // Step C: Upload audio and video to Azure Blob Storage
    logger.info('☁️ Uploading to Azure Blob Storage...');
    
    const [videoUrl, audioUrl] = await Promise.all([
      uploadToBlob(videoFilename, videoBuffer, 'video/mp4'),
      uploadToBlob(audioFilename, audioBuffer, 'audio/wav'),
    ]);
    
    logger.info('✅ Files uploaded to Azure Blob Storage');
    logger.info(`📹 Video URL: ${videoUrl}`);
    logger.info(`🎵 Audio URL: ${audioUrl}`);
    
    // Step D: Send audio to Azure Speech Service for transcription
    logger.info('🎤 Starting speech-to-text transcription...');
    
    let transcriptionResult = null;
    try {
      // Validate audio format before sending to Speech API
      if (!validateAudioFormat(audioBuffer)) {
        throw new Error('Invalid audio format for speech recognition');
      }
      
      transcriptionResult = await transcribeAudio(audioBuffer, 'fi-FI');
      logger.info('✅ Speech-to-text completed');
      logger.info(`📝 Transcription: ${transcriptionResult.transcription.substring(0, 100)}...`);
      logger.info(`⏱️ Duration: ${transcriptionResult.duration}s`);
    } catch (speechError) {
      logger.error('⚠️ Speech-to-text failed:', speechError);
    }
    
    // Step E: AI-powered chunking for optimal learning segments
    let aiGeneratedSegments: any = undefined;
    if (transcriptionResult) {
      try {
        logger.info('🤖 Starting AI-powered segmentation for learning optimization...');
        
        const segmentationResult = await segmentTranscriptionForLearning(
          transcriptionResult.transcription
        );
        
        aiGeneratedSegments = segmentationResult.transcriptionSegments;
        logger.info('✅ AI segmentation completed');
        logger.info(`📚 AI segments: ${segmentationResult.segmentCount}`);
        
      } catch (segmentationError) {
        logger.error('⚠️ AI segmentation failed:', segmentationError);
        throw segmentationError;
      }
    }
    
    // Persist metadata in Supabase database
    const learningMaterialRecord: Omit<LearningMaterialRecord, 'created_at' | 'updated_at'> = {
      id: materialId,
      youtube_url: youtubeUrl,
      video_blob_url: videoUrl,
      audio_blob_url: audioUrl,
      video_filename: videoFilename,
      audio_filename: audioFilename,
      video_size_bytes: videoBuffer.length,
      audio_size_bytes: audioBuffer.length,
      duration_seconds: transcriptionResult?.duration,
      transcription: transcriptionResult?.transcription,
      transcription_language: transcriptionResult?.language,
      transcription_segments: aiGeneratedSegments,
      status: 'completed',
    };
    
    const { error } = await supabase
      .from('learning_materials')
      .insert({
        ...learningMaterialRecord,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      logger.error('❌ Database error:', error);
      throw new Error(`Failed to save metadata: ${error.message}`);
    }
    
    logger.info('✅ Metadata saved to database');
    
    return {
      id: materialId,
      videoUrl,
      audioUrl,
    };
    
  } catch (error) {
    logger.error('❌ Processing failed:', error);
    
    // Update database with error status
    await supabase
      .from('learning_materials')
      .upsert({
        id: materialId,
        youtube_url: youtubeUrl,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    throw error;
  }
};