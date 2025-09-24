/**
 * Script to diagnose and fix Mixcloud upload issues
 * Checks storage bucket, OAuth tokens, and API connectivity
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

const TEMP_UPLOADS_BUCKET = 'temp-uploads';

async function checkStorageBucket() {
  console.log('🔍 Checking storage bucket...');

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Failed to list buckets:', listError);
      return false;
    }

    const bucketExists = buckets.some(bucket => bucket.name === TEMP_UPLOADS_BUCKET);

    if (!bucketExists) {
      console.log('⚠️ Bucket does not exist. Creating...');

      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(TEMP_UPLOADS_BUCKET, {
        public: false,
        allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'image/jpeg', 'image/png'],
        fileSizeLimit: 500 * 1024 * 1024 // 500MB
      });

      if (createError) {
        console.error('❌ Failed to create bucket:', createError);
        return false;
      }

      console.log('✅ Created temp-uploads bucket successfully');
    } else {
      console.log('✅ temp-uploads bucket exists');
    }

    return true;
  } catch (error) {
    console.error('❌ Storage check error:', error);
    return false;
  }
}

async function checkMixcloudTokens() {
  console.log('\n🔍 Checking Mixcloud OAuth tokens...');

  try {
    const { data: tokens, error } = await supabase
      .from('mixcloud_oauth_tokens')
      .select('*');

    if (error) {
      console.error('❌ Failed to fetch tokens:', error);
      return false;
    }

    console.log(`📊 Found ${tokens.length} OAuth tokens`);

    for (const token of tokens) {
      console.log(`\n🔑 Token for user ${token.user_id}:`);
      console.log(`   - Token exists: ${!!token.access_token}`);
      console.log(`   - Refresh token: ${!!token.refresh_token}`);
      console.log(`   - Expires at: ${token.expires_at || 'No expiry set'}`);
      console.log(`   - Mixcloud username: ${token.mixcloud_username || 'Not set'}`);

      // Check if token is expired
      if (token.expires_at) {
        const isExpired = new Date(token.expires_at) <= new Date();
        console.log(`   - Status: ${isExpired ? '⚠️ EXPIRED' : '✅ Valid'}`);
      }
    }

    return tokens.length > 0;
  } catch (error) {
    console.error('❌ Token check error:', error);
    return false;
  }
}

async function testMixcloudAPI() {
  console.log('\n🔍 Testing Mixcloud API connectivity...');

  if (!process.env.MIXCLOUD_CLIENT_ID || !process.env.MIXCLOUD_CLIENT_SECRET) {
    console.error('❌ Missing Mixcloud credentials in environment');
    return false;
  }

  try {
    // Test basic API connectivity
    const response = await fetch('https://api.mixcloud.com/discover/popular/');

    if (!response.ok) {
      console.error('❌ Mixcloud API unreachable:', response.status);
      return false;
    }

    const data = await response.json();
    console.log('✅ Mixcloud API is reachable');
    console.log(`   - Sample response contains ${data.data?.length || 0} items`);

    return true;
  } catch (error) {
    console.error('❌ Mixcloud API test error:', error);
    return false;
  }
}

async function checkUploadJobs() {
  console.log('\n🔍 Checking recent upload jobs...');

  try {
    const { data: jobs, error } = await supabase
      .from('upload_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Failed to fetch upload jobs:', error);
      return false;
    }

    console.log(`📊 Found ${jobs.length} recent upload jobs`);

    for (const job of jobs) {
      console.log(`\n📄 Job ${job.id}:`);
      console.log(`   - Status: ${job.status}`);
      console.log(`   - Created: ${new Date(job.created_at).toLocaleString()}`);
      console.log(`   - File: ${job.original_filename}`);
      console.log(`   - Show: ${job.show_title}`);
      if (job.error_message) {
        console.log(`   - Error: ${job.error_message}`);
      }
      if (job.storage_path) {
        console.log(`   - Storage: ${job.storage_path}`);
      }
      if (job.mixcloud_url) {
        console.log(`   - Mixcloud: ${job.mixcloud_url}`);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Upload jobs check error:', error);
    return false;
  }
}

async function testStorageUpload() {
  console.log('\n🧪 Testing storage upload capability...');

  try {
    // Create a small test file
    const testContent = 'Test file for storage upload validation';
    const testFilename = `test_${Date.now()}.txt`;
    const testPath = `test/${testFilename}`;

    // Upload test file
    const { data, error } = await supabase.storage
      .from(TEMP_UPLOADS_BUCKET)
      .upload(testPath, testContent, {
        contentType: 'text/plain'
      });

    if (error) {
      console.error('❌ Test upload failed:', error);
      return false;
    }

    console.log('✅ Test upload successful');

    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from(TEMP_UPLOADS_BUCKET)
      .remove([testPath]);

    if (deleteError) {
      console.warn('⚠️ Failed to clean up test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }

    return true;
  } catch (error) {
    console.error('❌ Storage upload test error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Mixcloud upload diagnostics...\n');

  const results = {
    storage: await checkStorageBucket(),
    tokens: await checkMixcloudTokens(),
    mixcloudAPI: await testMixcloudAPI(),
    uploadJobs: await checkUploadJobs(),
    storageUpload: await testStorageUpload()
  };

  console.log('\n📋 SUMMARY:');
  console.log('==================');
  Object.entries(results).forEach(([key, success]) => {
    console.log(`${key}: ${success ? '✅ PASS' : '❌ FAIL'}`);
  });

  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL SYSTEMS GO' : '❌ ISSUES DETECTED'}`);

  if (!allPassed) {
    console.log('\n🛠️ RECOMMENDED ACTIONS:');
    if (!results.storage) console.log('- Fix storage bucket configuration');
    if (!results.tokens) console.log('- Set up OAuth connection in admin panel');
    if (!results.mixcloudAPI) console.log('- Check network connectivity and API credentials');
    if (!results.storageUpload) console.log('- Review Supabase storage permissions');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);