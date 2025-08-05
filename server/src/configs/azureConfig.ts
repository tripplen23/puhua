import dotenv from 'dotenv';

dotenv.config();

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY as string;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION as string;

if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
  throw new Error('Missing Azure Speech environment variables. Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in your .env file');
}

export const azureSpeechConfig = {
  key: AZURE_SPEECH_KEY,
  region: AZURE_SPEECH_REGION,
};
