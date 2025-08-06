import { supabase } from '../../configs/dbConfig';
import ytdl from '@distube/ytdl-core';
import { v4 as uuidv4 } from 'uuid';
import { LearningMaterialRecord } from '../../types/learningMaterial';
import { streamToBuffer, extractAudioFromBuffer, uploadToBlob } from './helpers';

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
    console.log(`🎬 Processing YouTube video: ${youtubeUrl}`);
    
    // Step B: Extract audio from the YouTube video
    console.log('📥 Downloading video stream...');
    const videoStream = ytdl(youtubeUrl, {
      quality: 'highest',
      filter: 'audioandvideo',
    });
    
    const videoBuffer = await streamToBuffer(videoStream);
    console.log(`✅ Video downloaded: ${videoBuffer.length} bytes`);
    
    // Extract audio using system FFmpeg
    console.log('🎵 Extracting and converting audio with FFmpeg...');
    
    const audioBuffer = await extractAudioFromBuffer(videoBuffer);
    console.log(`✅ Audio extracted: ${audioBuffer.length} bytes`);
    
    // Step C: Upload audio and video to Azure Blob Storage
    console.log('☁️ Uploading to Azure Blob Storage...');
    
    const [videoUrl, audioUrl] = await Promise.all([
      uploadToBlob(videoFilename, videoBuffer, 'video/mp4'),
      uploadToBlob(audioFilename, audioBuffer, 'audio/wav'),
    ]);
    
    console.log('✅ Files uploaded to Azure Blob Storage');
    console.log(`📹 Video URL: ${videoUrl}`);
    console.log(`🎵 Audio URL: ${audioUrl}`);
    
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
      console.error('❌ Database error:', error);
      throw new Error(`Failed to save metadata: ${error.message}`);
    }
    
    console.log('✅ Metadata saved to database');
    
    return {
      id: materialId,
      videoUrl,
      audioUrl,
    };
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
    
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