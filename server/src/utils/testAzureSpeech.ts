import { azureSpeechConfig } from '../configs/azureSpeechConfig';

/**
 * Test Azure Speech Service connection
 */
export async function testAzureSpeechConnection(): Promise<void> {
  console.log('🔍 Testing Azure Speech Service connection...\n');

  // Check environment variables
  const { key, region } = azureSpeechConfig;

  if (!key || !region) {
    console.error('❌ Missing Azure Speech environment variables!');
    console.log('Please add to your .env file:');
    console.log('AZURE_SPEECH_KEY=your_azure_speech_key');
    console.log('AZURE_SPEECH_REGION=your_azure_speech_region');
    throw new Error('Missing Azure Speech environment variables');
  }

  console.log('✅ Azure Speech configuration loaded successfully');
  console.log(`📍 Region: ${region}`);
  console.log('✅ Key: [REDACTED - Length: ' + key.length + ' characters]');

  try {
    // Test 1: Basic connectivity test using the Speech SDK
    console.log('\n🧪 Test 1: Checking Speech SDK import...');
    
    // Try to import the Speech SDK
    let speechsdk;
    try {
      speechsdk = await import('microsoft-cognitiveservices-speech-sdk');
      console.log('✅ Speech SDK imported successfully');
    } catch (importError) {
      throw new Error(`Failed to import Speech SDK: ${importError}`);
    }

    // Test 2: Create Speech Config
    console.log('\n🧪 Test 2: Creating Speech Config...');
    try {
      const speechConfig = speechsdk.SpeechConfig.fromSubscription(key, region);
      console.log('✅ Speech Config created successfully');
      console.log(`📍 Endpoint: wss://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`);
      
      // Clean up
      speechConfig.close();
    } catch (configError) {
      throw new Error(`Failed to create Speech Config: ${configError}`);
    }

    console.log('\n🎉 Azure Speech Service connection test completed!');
  } catch (error) {
    console.error('❌ Error during connection test:', error);
    throw error;
  }
}