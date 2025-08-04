# Puhua Finnish Language Learning App - Development Plan

## Project Overview

**App Name:** Puhua (Finnish for "to speak")  
**Core Concept:** Shadowing technique for Finnish language learning using AI-powered speech analysis  
**Vision:** Help users learn Finnish through sentence-by-sentence video practice with real-time pronunciation feedback

## Technical Architecture

### Tech Stack
- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express + TypeScript  
- **Database:** Supabase
- **Package Manager:** pnpm
- **API Client:** Axios
- **State Management:** Zustand
- **AI Services:** Azure Speech API, Azure OpenAI
- **UI Framework:** Radix UI + Tailwind CSS

### Implementation Details
- **Video Source:** YouTube video "25 Finnish words to learn before 2025 | Learn Finnish by listening!"
- **Sentence Segmentation:** AI-driven automatic segmentation into short speech segments
- **Pronunciation Evaluation:** Azure Speech pronunciation assessment API
- **Audio Storage:** Cloud storage via Supabase
- **Environment:** Azure OpenAI API configured with credentials

## MVP Features

### Core MVP Components
1. **Preview Session** - Watch full video with skip option
2. **Practice Session** - Sentence-by-sentence playback with voice recording
3. **Note Taking** - Highlight new words during practice
4. **AI Evaluation** - Pronunciation feedback and scoring (1-5 scale)

### Future Features (Non-MVP)
- AI-generated Finnish/English subtitles
- Video upload system
- Advanced vocabulary management
- Progress analytics dashboard

## Development Phases

### Phase 1: Foundation Setup (Week 1)

#### 1.1 Complete Dependencies Installation

**Server additions needed:**
```bash
# Core dependencies
pnpm add @supabase/supabase-js axios cors dotenv
pnpm add -D typescript ts-node nodemon @types/cors

# Azure Speech SDK
pnpm add microsoft-cognitiveservices-speech-sdk

# YouTube processing & Audio/Video processing
pnpm add ytdl-core @ffmpeg/ffmpeg
```

**WebApp additions needed:**
```bash
# State management & API
pnpm add zustand axios

# Video & Audio handling
pnpm add react-player

# Azure Speech (client-side)
pnpm add microsoft-cognitiveservices-speech-sdk

# Supabase client
pnpm add @supabase/supabase-js
```

#### 1.2 Project Structure Setup
```
server/
├── src/
│   ├── controllers/     # API route handlers
│   ├── services/        # Business logic (Azure, Supabase)
│   ├── routes/          # Express routes
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # Helper functions
│   └── app.ts           # Express app setup
└── package.json

webapp/
├── src/
│   ├── components/
│   │   ├── video/       # Video player components
│   │   ├── audio/       # Recording components
│   │   └── ui/          # Reusable UI components
│   ├── stores/          # Zustand state management
│   ├── services/        # API calls and external services
│   ├── types/           # TypeScript interfaces
│   └── App.tsx
```

#### 1.3 Database Schema (Supabase)
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Videos table (user-owned learning materials)
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  youtube_url TEXT NOT NULL,
  title TEXT NOT NULL,
  duration INTEGER,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Segments table (AI-generated speech segments)
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id),
  start_time DECIMAL NOT NULL,
  end_time DECIMAL NOT NULL,
  finnish_text TEXT,
  english_translation TEXT,
  segment_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User sessions
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  video_id UUID REFERENCES videos(id),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  total_score DECIMAL
);

-- Audio recordings
CREATE TABLE audio_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES practice_sessions(id),
  segment_id UUID REFERENCES segments(id),
  audio_url TEXT NOT NULL,
  pronunciation_score DECIMAL,
  feedback_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vocabulary notes
CREATE TABLE vocabulary_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  segment_id UUID REFERENCES segments(id),
  word TEXT NOT NULL,
  context TEXT,
  user_note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 2: Core MVP Features (Week 2-3)

#### 2.1 Video Preview System
- **Components:**
  - `VideoPlayer.tsx` - Main video component using react-player
  - `VideoControls.tsx` - Custom controls overlay
  - `SkipButton.tsx` - Jump to practice session
- **Features:**
  - YouTube video integration
  - Play, pause, volume, fullscreen controls
  - Responsive design for mobile/desktop
  - Loading states and error handling

#### 2.2 Speech Segmentation Pipeline
- **Backend Services:**
  - `YouTubeService.ts` - Audio extraction from YouTube
  - `AzureSpeechService.ts` - Speech-to-text and segmentation
  - `SegmentationService.ts` - Intelligent break detection
- **API Endpoints:**
  - `POST /api/videos/process` - Process YouTube video
  - `GET /api/videos/:id/segments` - Get video segments
- **Algorithm:**
  - Extract audio using ytdl-core
  - Use Azure Speech-to-Text for transcription
  - Detect natural speech breaks (pauses, intonation)
  - Create optimal shadowing segments (2-8 seconds)

#### 2.3 Audio Recording System
- **Components:**
  - `AudioRecorder.tsx` - Web Audio API integration
  - `RecordingControls.tsx` - Start/stop/replay controls
  - `WaveformVisualizer.tsx` - Real-time audio visualization
- **Features:**
  - Browser-based audio recording
  - Visual feedback during recording
  - Audio file upload to Supabase storage
  - Playback comparison (user vs. original)

### Phase 3: AI Integration (Week 3-4)

#### 3.1 Pronunciation Evaluation
- **Backend Services:**
  - `PronunciationService.ts` - Azure Speech pronunciation assessment
  - `FeedbackService.ts` - Generate improvement suggestions
  - `ScoringService.ts` - Calculate 1-5 scale scores
- **API Endpoints:**
  - `POST /api/pronunciation/evaluate` - Analyze user recording
  - `GET /api/sessions/:id/feedback` - Get session feedback
- **Features:**
  - Real-time pronunciation analysis
  - Detailed feedback on accuracy, fluency, completeness
  - Personalized improvement tips
  - Progress tracking over time

#### 3.2 Note-Taking System
- **Components:**
  - `WordHighlighter.tsx` - Interactive text highlighting
  - `VocabularyPanel.tsx` - Personal word collection
  - `ContextViewer.tsx` - Show word in sentence context
- **Features:**
  - Click-to-highlight words during practice
  - Automatic vocabulary list generation
  - Context preservation for each word
  - AI-powered grammar explanations using Azure OpenAI

### Phase 4: State Management & Polish (Week 4-5)

#### 4.1 Zustand Stores
```typescript
// Session store
interface SessionStore {
  currentVideo: Video | null;
  currentSegment: Segment | null;
  isRecording: boolean;
  recordings: AudioRecording[];
  progress: SessionProgress;
}

// Vocabulary store
interface VocabularyStore {
  highlightedWords: VocabularyNote[];
  addWord: (word: string, context: string) => void;
  removeWord: (id: string) => void;
}

// User store
interface UserStore {
  user: User | null;
  sessions: PracticeSession[];
  overallProgress: UserProgress;
}
```

#### 4.2 API Layer (Axios)
```typescript
// API service with TypeScript
class ApiService {
  private client = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: { 'Content-Type': 'application/json' }
  });

  async processVideo(youtubeId: string): Promise<Video>;
  async getSegments(videoId: string): Promise<Segment[]>;
  async uploadRecording(file: Blob, segmentId: string): Promise<AudioRecording>;
  async evaluatePronunciation(recordingId: string): Promise<PronunciationResult>;
}
```

#### 4.3 UI/UX Enhancements
- Loading states with skeleton components
- Error boundaries and fallback UI
- Mobile-first responsive design
- Accessibility (ARIA labels, keyboard navigation)
- Performance optimization (lazy loading, memoization)

## Current Status

### ✅ Completed
- Basic project structure (server + webapp)
- TypeScript configuration
- UI component library setup (Radix UI + Tailwind)
- Azure OpenAI credentials configuration
- Environment setup with .gitignore

### 🔄 In Progress
- Dependency installation planning
- Database schema design
- API architecture planning

### ⏳ Next Steps
1. Install missing dependencies in both projects
2. Set up Supabase project and database schema
3. Create basic Express API structure
4. Implement video player component
5. Build speech segmentation pipeline

## Success Metrics

### MVP Success Criteria
- [ ] Users can watch Finnish video in preview mode
- [ ] Users can practice sentence-by-sentence with audio recording
- [ ] Users receive pronunciation feedback and scores
- [ ] Users can highlight and save vocabulary words
- [ ] System processes YouTube video into practice segments automatically

### Technical Success Criteria
- [ ] Sub-2 second response time for API calls
- [ ] 95%+ uptime for core functionality
- [ ] Mobile responsive design (works on phones/tablets)
- [ ] Secure audio file storage and user data handling
- [ ] TypeScript coverage across entire codebase

## Risk Mitigation

### Technical Risks
- **YouTube API limitations:** Have fallback for video processing
- **Azure Speech API costs:** Implement usage monitoring and limits
- **Browser audio recording compatibility:** Test across major browsers
- **Real-time audio processing performance:** Optimize with Web Workers

### User Experience Risks
- **Learning curve too steep:** Provide clear onboarding tutorial
- **Pronunciation feedback too harsh:** Balance constructive criticism
- **Mobile usability issues:** Prioritize mobile-first design approach

## Timeline Summary

- **Week 1:** Foundation setup, dependencies, database schema
- **Week 2:** Video player, basic recording, segmentation pipeline  
- **Week 3:** AI integration, pronunciation evaluation, note-taking
- **Week 4:** State management, API polish, UI enhancements
- **Week 5:** Testing, optimization, deployment preparation

**Target MVP Launch:** End of Week 5

---

*This plan is a living document and will be updated as development progresses and new requirements emerge.*
