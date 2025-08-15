import { TranscriptionSegment, SubtitleCue, SubtitleFormat } from '../../types/learningMaterial';
import { logger } from '../../configs/logger';

/**
 * Converts transcription segments to subtitle cues
 * @param segments - Array of transcription segments with timing
 * @returns Array of subtitle cues
 */
export const convertSegmentsToSubtitleCues = (segments: TranscriptionSegment[]): SubtitleCue[] => {
  return segments.map((segment, index) => ({
    id: `cue-${index + 1}`,
    startTime: segment.startTime,
    endTime: segment.endTime,
    text: segment.text.trim(),
  }));
};

/**
 * Formats time in seconds to WebVTT timestamp format (HH:MM:SS.mmm)
 * @param seconds - Time in seconds
 * @returns Formatted timestamp string
 */
const formatWebVTTTimestamp = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
};

/**
 * Formats time in seconds to SRT timestamp format (HH:MM:SS,mmm)
 * @param seconds - Time in seconds
 * @returns Formatted timestamp string
 */
const formatSRTTimestamp = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0').replace('.', ',')}`;
};

/**
 * Generates WebVTT subtitle format
 * @param cues - Array of subtitle cues
 * @returns WebVTT formatted string
 */
export const generateWebVTT = (cues: SubtitleCue[]): string => {
  let webvtt = 'WEBVTT\n\n';
  
  cues.forEach((cue) => {
    webvtt += `${cue.id}\n`;
    webvtt += `${formatWebVTTTimestamp(cue.startTime)} --> ${formatWebVTTTimestamp(cue.endTime)}\n`;
    webvtt += `${cue.text}\n\n`;
  });
  
  return webvtt;
};

/**
 * Generates SRT subtitle format
 * @param cues - Array of subtitle cues
 * @returns SRT formatted string
 */
export const generateSRT = (cues: SubtitleCue[]): string => {
  let srt = '';
  
  cues.forEach((cue, index) => {
    srt += `${index + 1}\n`;
    srt += `${formatSRTTimestamp(cue.startTime)} --> ${formatSRTTimestamp(cue.endTime)}\n`;
    srt += `${cue.text}\n\n`;
  });
  
  return srt;
};

/**
 * Generates both WebVTT and SRT subtitle formats
 * @param segments - Array of transcription segments with timing
 * @returns Object containing both subtitle formats
 */
export const generateSubtitles = (segments: TranscriptionSegment[]): SubtitleFormat => {
  logger.info(`📝 Generating subtitles from ${segments.length} segments`);
  
  const cues = convertSegmentsToSubtitleCues(segments);
  
  const webvtt = generateWebVTT(cues);
  const srt = generateSRT(cues);
  
  logger.info('✅ Subtitles generated successfully');
  logger.info(`📊 WebVTT size: ${webvtt.length} characters`);
  logger.info(`📊 SRT size: ${srt.length} characters`);
  
  return {
    webvtt,
    srt,
  };
};

/**
 * Validates subtitle timing to ensure no overlaps or gaps
 * @param segments - Array of transcription segments
 * @returns Array of validation warnings
 */
export const validateSubtitleTiming = (segments: TranscriptionSegment[]): string[] => {
  const warnings: string[] = [];
  
  for (let i = 0; i < segments.length; i++) {
    const current = segments[i];
    
    // Check if start time is before end time
    if (current.startTime >= current.endTime) {
      warnings.push(`Segment ${i + 1}: Start time (${current.startTime}s) is not before end time (${current.endTime}s)`);
    }
    
    // Check for overlaps with next segment
    if (i < segments.length - 1) {
      const next = segments[i + 1];
      if (current.endTime > next.startTime) {
        warnings.push(`Segments ${i + 1} and ${i + 2}: Overlap detected (${current.endTime}s > ${next.startTime}s)`);
      }
    }
    
    // Check for very short segments (less than 0.5 seconds)
    const duration = current.endTime - current.startTime;
    if (duration < 0.5) {
      warnings.push(`Segment ${i + 1}: Very short duration (${duration.toFixed(2)}s)`);
    }
    
    // Check for very long segments (more than 10 seconds)
    if (duration > 10) {
      warnings.push(`Segment ${i + 1}: Very long duration (${duration.toFixed(2)}s) - consider splitting for better shadowing practice`);
    }
  }
  
  if (warnings.length > 0) {
    logger.warn(`⚠️ Subtitle validation found ${warnings.length} issues:`);
    warnings.forEach(warning => logger.warn(`  - ${warning}`));
  } else {
    logger.info('✅ Subtitle timing validation passed');
  }
  
  return warnings;
};
