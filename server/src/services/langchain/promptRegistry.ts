import { PromptTemplate } from '@langchain/core/prompts'; 

export const createFinnishSegmentationPrompt = () => new PromptTemplate({
  inputVariables: ['fullTranscription'],
  template: `You are an expert Finnish language teacher specializing in the shadowing technique for language learning.

  Your task is to break down this Finnish transcription into optimal segments for shadowing practice, paying special attention to:
  - SPEAKER CHANGES and dialogue patterns
  - Natural conversation flow and turn-taking
  - Context clues that indicate different speakers
  - Meaningful chunks for pronunciation practice

  Each segment should be:
  - Short and manageable (2-6 seconds ideal for dialogue)
  - Respect natural speaker boundaries
  - Complete thoughts or conversational turns
  - Ideal for shadowing practice

  TRANSCRIPTION TO ANALYZE:
  "{fullTranscription}"

  ANALYSIS GUIDELINES:
  1. Look for dialogue patterns (greetings, responses, questions/answers)
  2. Identify potential speaker changes based on:
    - Conversational flow (question → answer)
    - Greeting patterns ("hei" → response)
    - Introduction patterns ("minä olen..." → "minä olen...")
    - Natural conversation breaks
  3. Consider Finnish conversational markers and social cues
  4. Break at natural pauses between speakers

  Please break this into 10-20 optimal learning segments. For each segment, provide:
  1. The Finnish text (exactly as transcribed)
  2. Segment type (sentence/phrase/greeting/question/dialogue)
  3. Speaker hint if you detect a likely speaker change
  4. Context notes for learners if helpful

  Respond in this JSON format:
  {{
    "segments": [
      {{
        "text": "Hei, minä olen Jutta Schneider.",
        "segmentType": "greeting",
        "speakerHint": "speaker1",
        "contextNotes": "Introduction by first speaker"
      }},
      {{
        "text": "Kiitos, minä olen Kari.",
        "segmentType": "dialogue",
        "speakerHint": "speaker2",
        "contextNotes": "Response from second speaker"
      }}
    ]
  }}

  Focus on creating segments that help learners understand dialogue flow and practice natural Finnish conversation patterns.`
});

export const createHealthCheckPrompt = () => new PromptTemplate({
  inputVariables: [],
  template: `Hello, respond with "OK" if you can understand this.`
});

export const PromptRegistry = {
  finnishSegmentation: createFinnishSegmentationPrompt,
  healthCheck: createHealthCheckPrompt,
} as const;