-- Learning Materials table schema for Supabase
CREATE TABLE IF NOT EXISTS learning_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_url TEXT NOT NULL,
    video_blob_url TEXT,
    audio_blob_url TEXT,
    video_filename TEXT,
    audio_filename TEXT,
    video_size_bytes BIGINT,
    audio_size_bytes BIGINT,
    duration_seconds INTEGER,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_learning_materials_status ON learning_materials(status);
CREATE INDEX IF NOT EXISTS idx_learning_materials_created_at ON learning_materials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_materials_youtube_url ON learning_materials(youtube_url);

-- Enable RLS (Row Level Security) if needed
-- ALTER TABLE learning_materials ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_learning_materials_updated_at 
    BEFORE UPDATE ON learning_materials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
