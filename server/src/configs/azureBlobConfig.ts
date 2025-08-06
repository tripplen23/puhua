import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';

dotenv.config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'learning-materials';

if (!AZURE_STORAGE_CONNECTION_STRING) {
  console.warn('⚠️ AZURE_STORAGE_CONNECTION_STRING not found in environment variables. Azure Blob Storage will not be available.');
}

export const blobServiceClient = AZURE_STORAGE_CONNECTION_STRING 
  ? BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
  : null;
export const containerName = AZURE_STORAGE_CONTAINER_NAME;

// Initialize container if it doesn't exist
export const initializeContainer = async () => {
  if (!blobServiceClient) {
    console.warn('⚠️ Azure Blob Storage not configured. Skipping container initialization.');
    return;
  }
  
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    console.log(`✅ Azure Blob container "${containerName}" initialized`);
  } catch (error) {
    console.error('❌ Failed to initialize Azure Blob container:', error);
    throw error;
  }
};
