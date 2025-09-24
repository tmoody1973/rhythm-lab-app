/**
 * Update bucket MIME types to allow all necessary file types
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

async function updateBucketMimeTypes() {
  console.log('🔧 Updating bucket MIME type restrictions...');

  try {
    // Update bucket to be more permissive
    const { error } = await supabase.storage.updateBucket('temp-uploads', {
      public: false,
      fileSizeLimit: 524288000, // 500MB
      allowedMimeTypes: null // Remove MIME type restrictions
    });

    if (error) {
      console.error('❌ Failed to update bucket:', error);

      // Try alternative approach - set common MIME types
      console.log('⚠️ Trying with specific MIME types...');
      const { error: error2 } = await supabase.storage.updateBucket('temp-uploads', {
        public: false,
        fileSizeLimit: 524288000,
        allowedMimeTypes: [
          'audio/mpeg',
          'audio/wav',
          'audio/mp3',
          'audio/mp4',
          'image/jpeg',
          'image/png',
          'image/jpg',
          'text/plain',
          'application/octet-stream'
        ]
      });

      if (error2) {
        console.error('❌ Alternative update failed:', error2);
        return false;
      }
    }

    console.log('✅ Bucket MIME types updated');
    return true;
  } catch (error) {
    console.error('❌ Bucket update error:', error);
    return false;
  }
}

async function testUploads() {
  console.log('\n🧪 Testing uploads after MIME type update...');

  const tests = [
    {
      name: 'Text file',
      content: 'Test content',
      filename: `text_test_${Date.now()}.txt`,
      contentType: 'text/plain'
    },
    {
      name: 'Binary file',
      content: Buffer.alloc(1024, 'test'),
      filename: `binary_test_${Date.now()}.bin`,
      contentType: 'application/octet-stream'
    },
    {
      name: 'Audio file simulation',
      content: Buffer.alloc(1024, 'mp3'),
      filename: `audio_test_${Date.now()}.mp3`,
      contentType: 'audio/mpeg'
    }
  ];

  const results = {};

  for (const test of tests) {
    console.log(`\n📤 Testing ${test.name}...`);

    try {
      const testPath = `test/${test.filename}`;

      const { data, error } = await supabase.storage
        .from('temp-uploads')
        .upload(testPath, test.content, {
          contentType: test.contentType
        });

      if (error) {
        console.error(`❌ ${test.name} failed:`, error.message);
        results[test.name] = false;
      } else {
        console.log(`✅ ${test.name} successful`);
        results[test.name] = true;

        // Clean up
        await supabase.storage
          .from('temp-uploads')
          .remove([testPath]);
      }
    } catch (error) {
      console.error(`❌ ${test.name} error:`, error.message);
      results[test.name] = false;
    }
  }

  return results;
}

async function main() {
  console.log('🚀 Updating bucket configuration...\n');

  const updateSuccess = await updateBucketMimeTypes();

  if (!updateSuccess) {
    console.log('\n❌ Could not update bucket configuration');
    process.exit(1);
  }

  const testResults = await testUploads();

  console.log('\n📋 TEST RESULTS:');
  console.log('==================');
  Object.entries(testResults).forEach(([test, success]) => {
    console.log(`${test}: ${success ? '✅ PASS' : '❌ FAIL'}`);
  });

  const allPassed = Object.values(testResults).every(Boolean);

  console.log(`\n🎯 Upload Status: ${allPassed ? '✅ READY' : '❌ ISSUES REMAIN'}`);

  if (allPassed) {
    console.log('\n🎉 Storage is now ready for Mixcloud uploads!');
    console.log('\n📝 Next steps:');
    console.log('1. Test actual Mixcloud upload in admin panel');
    console.log('2. Verify OAuth token authentication');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);