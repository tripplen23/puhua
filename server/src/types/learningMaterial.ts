export interface CreateLearningMaterialRequest {
  youtubeUrl: string;
}

export interface CreateLearningMaterialResponse {
  id: string;
  youtubeUrl: string;
  videoUrl: string;
  audioUrl: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface LearningMaterialRecord {
  id: string;
  youtube_url: string;
  video_blob_url: string;
  audio_blob_url: string;
  video_filename: string;
  audio_filename: string;
  video_size_bytes: number;
  audio_size_bytes: number;
  duration_seconds?: number;
  transcription?: string;
  transcription_language?: string;
  transcription_segments?: TranscriptionSegment[];
  webvtt_blob_url?: string;
  srt_blob_url?: string;
  webvtt_filename?: string;
  srt_filename?: string;
  status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface TranscriptionSegment {
  text: string;
  startTime: number; // Start time in seconds
  endTime: number; // End time in seconds
  segmentType: 'sentence' | 'phrase' | 'greeting' | 'question' | 'dialogue';
  speakerHint: string; // 'speaker1', 'speaker2', 'narrator', etc.
  contextNotes: string; // Additional context for learners
}

// Additional interfaces for subtitle generation
export interface SubtitleCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface SubtitleFormat {
  webvtt: string;
  srt: string;
}