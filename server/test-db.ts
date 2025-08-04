#!/usr/bin/env ts-node

/**
 * Server Database Connection Test Runner
 * Run with: pnpm run test-db
 */

import { testDatabaseConnection } from './src/utils/testConnection';

console.log('🚀 Starting Puhua Server Database Connection Test\n');
console.log('='.repeat(60));

testDatabaseConnection()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Server database test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Server database test failed:', error);
    process.exit(1);
  });
