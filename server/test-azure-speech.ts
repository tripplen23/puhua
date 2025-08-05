#!/usr/bin/env ts-node

/**
 * Azure Speech Service Connection Test Runner
 * Run with: pnpm run test-azure-speech
 */

import { testAzureSpeechConnection } from './src/utils/testAzureSpeech';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Starting Azure Speech Service Connection Test\n');
console.log('='.repeat(60));

testAzureSpeechConnection()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Azure Speech Service test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Azure Speech Service test failed:', error);
    process.exit(1);
  });

testAzureSpeechConnection()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Azure Speech Service test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Azure Speech Service test failed:', error);
    process.exit(1);
  });