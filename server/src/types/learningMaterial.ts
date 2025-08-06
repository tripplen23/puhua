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
  status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}
