import { blobServiceClient, containerName, initializeContainer } from '../../configs/azureBlobConfig';
import { Readable } from 'stream';
import { spawn } from 'child_process';

// Helper function to convert stream to buffer
const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

// Helper function to extract audio from video buffer using system FFmpeg
const extractAudioFromBuffer = async (videoBuffer: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn('ffmpeg', [
      '-i', 'pipe:0',        // Input from stdin
      '-vn',                 // No video
      '-acodec', 'pcm_s16le', // PCM 16-bit little-endian
      '-ac', '1',            // Mono
      '-ar', '16000',        // 16kHz sample rate
      '-f', 'wav',           // Output format
      'pipe:1'               // Output to stdout
    ]);
    
    const audioChunks: Buffer[] = [];
    let errorOutput = '';
    
    // Collect audio data
    ffmpegProcess.stdout.on('data', (chunk) => {
      audioChunks.push(chunk);
    });
    
    // Collect error output for debugging
    ffmpegProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Handle process completion
    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        const audioBuffer = Buffer.concat(audioChunks);
        resolve(audioBuffer);
      } else {
        console.error('FFmpeg stderr:', errorOutput);
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
    
    // Handle process errors
    ffmpegProcess.on('error', (error) => {
      reject(new Error(`Failed to start FFmpeg: ${error.message}`));
    });
    
    // Write video buffer to FFmpeg stdin
    ffmpegProcess.stdin.write(videoBuffer);
    ffmpegProcess.stdin.end();
  });
};

// Helper function to upload buffer to Azure Blob Storage
const uploadToBlob = async (filename: string, buffer: Buffer, contentType: string): Promise<string> => {
  if (!blobServiceClient) {
    throw new Error('Azure Blob Storage is not configured. Please set AZURE_STORAGE_CONNECTION_STRING in your .env file.');
  }
  
  await initializeContainer();
  
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(filename);
  
  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: {
      blobContentType: contentType,
    },
  });
  
  return blockBlobClient.url;
};

export {
  streamToBuffer,
  extractAudioFromBuffer,
  uploadToBlob,
};