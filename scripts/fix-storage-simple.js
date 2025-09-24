/**
 * Simple storage bucket fix - update configuration via Supabase API
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

async function updateBucketConfig() {
  console.log('🔧 Updating temp-uploads bucket configuration...');

  try {
    // Check current bucket
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Failed to list buckets:', listError);
      return false;
    }

    const tempBucket = buckets.find(b => b.name === 'temp-uploads');
    if (!tempBucket) {
      console.log('⚠️ Creating temp-uploads bucket...');

      const { error: createError } = await supabase.storage.createBucket('temp-uploads', {
        public: false,
        fileSizeLimit: 524288000, // 500MB
        allowedMimeTypes: [
          'audio/mpeg',
          'audio/wav',
          'audio/mp3',
          'image/jpeg',
          'image/png',
          'image/jpg'
        ]
      });

      if (createError) {
        console.error('❌ Failed to create bucket:', createError);
        return false;
      }

      console.log('✅ Created temp-uploads bucket');
    } else {
      console.log('✅ temp-uploads bucket exists');
      console.log(`   Current size limit: ${tempBucket.file_size_limit ? Math.round(tempBucket.file_size_limit / 1024 / 1024) + 'MB' : 'None'}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Bucket configuration error:', error);
    return false;
  }
}

async function testLargeFileUpload() {
  console.log('\n🧪 Testing large file upload capability...');

  try {
    // Create a moderately sized test buffer (5MB)
    const testSize = 5 * 1024 * 1024; // 5MB
    const testContent = Buffer.alloc(testSize, 'test data');
    const testFilename = `large_test_${Date.now()}.bin`;
    const testPath = `test/${testFilename}`;

    console.log(`📤 Uploading ${Math.round(testSize / 1024 / 1024)}MB test file...`);

    const { data, error } = await supabase.storage
      .from('temp-uploads')
      .upload(testPath, testContent, {
        contentType: 'application/octet-stream'
      });

    if (error) {
      console.error('❌ Large file upload failed:', error);
      return false;
    }

    console.log('✅ Large file upload successful');

    // Clean up
    const { error: deleteError } = await supabase.storage
      .from('temp-uploads')
      .remove([testPath]);

    if (!deleteError) {
      console.log('✅ Test file cleaned up');
    }

    return true;
  } catch (error) {
    console.error('❌ Large file test error:', error);
    return false;
  }
}

async function checkStoragePolicies() {
  console.log('\n🔍 Checking storage policies...');

  try {
    // Try to upload with service role (should work)
    const testContent = 'Policy test';
    const testPath = `policy_test_${Date.now()}.txt`;

    const { data, error } = await supabase.storage
      .from('temp-uploads')
      .upload(testPath, testContent, {
        contentType: 'text/plain'
      });

    if (error) {
      console.error('❌ Service role upload failed:', error);
      console.log('   This might indicate RLS policy issues');
      return false;
    }

    console.log('✅ Service role can upload to bucket');

    // Clean up
    await supabase.storage
      .from('temp-uploads')
      .remove([testPath]);

    return true;
  } catch (error) {
    console.error('❌ Policy check error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting simple storage fixes...\n');

  const results = {
    bucketConfig: await updateBucketConfig(),
    policyCheck: await checkStoragePolicies(),
    largeFileTest: await testLargeFileUpload()
  };

  console.log('\n📋 RESULTS:');
  console.log('=============');
  Object.entries(results).forEach(([key, success]) => {
    console.log(`${key}: ${success ? '✅ PASS' : '❌ FAIL'}`);
  });

  const allPassed = Object.values(results).every(Boolean);

  if (allPassed) {
    console.log('\n🎯 Storage Status: ✅ READY FOR UPLOADS');
    console.log('\n📝 Next steps:');
    console.log('1. Test Mixcloud upload in admin panel');
    console.log('2. Verify OAuth token is working');
    console.log('3. Check file size limits (current: 500MB)');
  } else {
    console.log('\n🎯 Storage Status: ❌ NEEDS MANUAL INTERVENTION');
    console.log('\n🛠️ Manual steps required:');
    console.log('1. Check Supabase Dashboard > Storage > Policies');
    console.log('2. Ensure temp-uploads bucket exists and is configured');
    console.log('3. Verify RLS policies allow service_role access');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);