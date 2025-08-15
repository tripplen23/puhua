import { supabase } from '../../configs/dbConfig';
import ytdl from '@distube/ytdl-core';
import { v4 as uuidv4 } from 'uuid';
import { LearningMaterialRecord } from '../../types/learningMaterial';
import { streamToBuffer, extractAudioFromBuffer, uploadToBlob } from './helpers';
import { transcribeAudio, validateAudioFormat } from './speechService';
import { segmentTranscriptionForLearning } from './aiSegmentService';
import { generateSubtitles, validateSubtitleTiming } from './subtitleService';
import { logger } from '../../configs/logger';
import { syncTime } from './syncTimeService';

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
  const webvttFilename = `${materialId}/subtitles_${timestamp}.vtt`;
  const srtFilename = `${materialId}/subtitles_${timestamp}.srt`;
  
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
    
    // Step E: AI-powered enhancement of segments for optimal learning
    let finalSegments: any = undefined;
    let subtitleFiles: { webvtt: string; srt: string } | undefined = undefined;
    
    if (transcriptionResult) {
      try {
        logger.info('🤖 Starting AI-powered segment enhancement...');
        
        // Start with timing-based segments from speech recognition
        let enhancedSegments = transcriptionResult.segments;
        
        // Use AI to enhance segment classification and context
        if (enhancedSegments.length > 0) {
          const segmentationResult = await segmentTranscriptionForLearning(
            transcriptionResult.transcription
          );
          
          // Merge AI insights with timing information
          enhancedSegments = syncTime(
            enhancedSegments,
            segmentationResult.transcriptionSegments
          );
          
          logger.info('✅ AI segment enhancement completed');
          logger.info(`📚 Enhanced segments: ${enhancedSegments.length}`);
          
          // Step F: Generate synchronized subtitles
          logger.info('📝 Generating synchronized subtitles...');
          
          // Validate timing before generating subtitles
          const timingWarnings = validateSubtitleTiming(enhancedSegments);
          if (timingWarnings.length > 0) {
            logger.warn(`⚠️ Timing validation warnings: ${timingWarnings.length}`);
          }
          
          // Generate WebVTT and SRT subtitle formats
          subtitleFiles = generateSubtitles(enhancedSegments);
          logger.info('✅ Subtitles generated successfully');
          
          finalSegments = enhancedSegments;
        }
        
      } catch (segmentationError) {
        logger.error('⚠️ AI segment enhancement failed:', segmentationError);
        // Fall back to basic segments from speech recognition
        finalSegments = transcriptionResult.segments;
        logger.info('📋 Using basic segments from speech recognition');
      }
    }
    
    // Step G: Upload subtitle files to Azure Blob Storage
    let webvttUrl: string | undefined = undefined;
    let srtUrl: string | undefined = undefined;
    
    if (subtitleFiles) {
      try {
        logger.info('☁️ Uploading subtitle files to Azure Blob Storage...');
        
        const [webvttUpload, srtUpload] = await Promise.all([
          uploadToBlob(webvttFilename, Buffer.from(subtitleFiles.webvtt, 'utf8'), 'text/vtt'),
          uploadToBlob(srtFilename, Buffer.from(subtitleFiles.srt, 'utf8'), 'text/plain'),
        ]);
        
        webvttUrl = webvttUpload;
        srtUrl = srtUpload;
        
        logger.info('✅ Subtitle files uploaded to Azure Blob Storage');
        logger.info(`📝 WebVTT URL: ${webvttUrl}`);
        logger.info(`📝 SRT URL: ${srtUrl}`);
      } catch (subtitleUploadError) {
        logger.error('⚠️ Subtitle upload failed:', subtitleUploadError);
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
      transcription_segments: finalSegments,
      webvtt_blob_url: webvttUrl,
      srt_blob_url: srtUrl,
      webvtt_filename: webvttFilename,
      srt_filename: srtFilename,
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