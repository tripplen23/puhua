import { Request, Response, NextFunction } from 'express';
import { processYouTubeVideo } from '../services/learningMaterialService';
import { CreateLearningMaterialRequest, CreateLearningMaterialResponse } from '../types/learningMaterial';

export const createLearningMaterial = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { youtubeUrl }: CreateLearningMaterialRequest = req.body;
    
    // Validate input
    if (!youtubeUrl) {
      res.status(400).json({ 
        error: 'Missing required field: youtubeUrl' 
      });
      return;
    }
    
    if (typeof youtubeUrl !== 'string' || youtubeUrl.trim() === '') {
      res.status(400).json({ 
        error: 'youtubeUrl must be a non-empty string' 
      });
      return;
    }
    
    console.log(`🚀 Processing request for YouTube URL: ${youtubeUrl}`);
    
    // Process the YouTube video
    const result = await processYouTubeVideo(youtubeUrl.trim());
    
    // Return success response
    const response: CreateLearningMaterialResponse = {
      id: result.id,
      youtubeUrl: youtubeUrl.trim(),
      videoUrl: result.videoUrl,
      audioUrl: result.audioUrl,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    
    console.log(`✅ Successfully processed learning material: ${result.id}`);
    res.status(201).json(response);
    
  } catch (error) {
    console.error('❌ Error in createLearningMaterial:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid YouTube URL')) {
        res.status(400).json({ 
          error: 'Invalid YouTube URL provided' 
        });
        return;
      }
      
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        res.status(429).json({ 
          error: 'YouTube rate limit exceeded. Please try again later.' 
        });
        return;
      }
    }
    
    // Pass other errors to global error handler
    next(error);
  }
};