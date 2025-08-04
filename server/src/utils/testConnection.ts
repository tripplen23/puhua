import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test Supabase database connection from server
 */
export async function testDatabaseConnection(): Promise<void> {
  console.log('🔍 Testing Supabase database connection from server...\n');

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.log('Please add to your .env file:');
    console.log('SUPABASE_URL=your_supabase_url');
    console.log('SUPABASE_ANON_KEY=your_supabase_anon_key');
    return;
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Supabase client created successfully');
    console.log(`📍 URL: ${supabaseUrl}`);

    // Test 1: Basic connection test
    console.log('\n🧪 Test 1: Basic connection test...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return;
    }
    
    console.log('✅ Basic connection successful');

    // Test 2: Check if tables exist
    console.log('\n🧪 Test 2: Checking table structure...');
    const tables = ['users', 'videos', 'segments', 'practice_sessions', 'audio_recordings', 'vocabulary_notes'];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('*').limit(1);
        if (tableError) {
          console.log(`❌ Table '${table}': ${tableError.message}`);
        } else {
          console.log(`✅ Table '${table}': exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err}`);
      }
    }

    // Test 3: Test storage bucket
    console.log('\n🧪 Test 3: Testing storage bucket...');
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.log('❌ Storage bucket test failed:', bucketError.message);
      } else {
        console.log('✅ Storage accessible');
        const audioBucket = buckets?.find(bucket => bucket.name === 'audio-recordings');
        if (audioBucket) {
          console.log('✅ Audio recordings bucket exists');
        } else {
          console.log('⚠️  Audio recordings bucket not found - you may need to create it');
        }
      }
    } catch (err) {
      console.log('❌ Storage test error:', err);
    }

    // Test 4: Test RLS policies (if any data exists)
    console.log('\n🧪 Test 4: Testing Row Level Security...');
    try {
      // This should work without authentication for public operations
      const { data: publicData, error: rlsError } = await supabase
        .from('videos')
        .select('id, title, is_public')
        .eq('is_public', true)
        .limit(1);
      
      if (rlsError) {
        console.log('⚠️  RLS test (expected if no public videos):', rlsError.message);
      } else {
        console.log('✅ RLS policies working - can access public videos');
      }
    } catch (err) {
      console.log('⚠️  RLS test error (this may be expected):', err);
    }

    console.log('\n🎉 Database connection test completed!');
    console.log('📝 Summary:');
    console.log('   - Supabase client: ✅ Working');
    console.log('   - Database tables: Check individual results above');
    console.log('   - Storage bucket: Check result above');
    console.log('   - RLS policies: Check result above');

  } catch (error) {
    console.error('❌ Unexpected error during connection test:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection().catch(console.error);
}
