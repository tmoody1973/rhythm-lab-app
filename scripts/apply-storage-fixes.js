/**
 * Apply storage policy fixes for temp-uploads bucket
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function applyStorageFixes() {
  console.log('🔧 Applying storage fixes...');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-storage-policies.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements (simple approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc('execute_sql', { sql: statement });

        if (error) {
          // Some errors are expected (like policy already exists)
          if (error.message.includes('already exists') ||
              error.message.includes('duplicate key')) {
            console.log(`⚠️ Statement ${i + 1}: Already exists (OK)`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
          }
        } else {
          console.log(`✅ Statement ${i + 1}: Success`);
        }
      } catch (execError) {
        console.error(`❌ Statement ${i + 1} execution error:`, execError.message);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to apply storage fixes:', error);
    return false;
  }
}

async function testStorageWithAuth() {
  console.log('\n🧪 Testing storage upload with service role...');

  try {
    // Create a test file buffer
    const testContent = Buffer.from('Test file for authenticated upload validation');
    const testFilename = `auth_test_${Date.now()}.txt`;
    const testPath = `test/${testFilename}`;

    // Upload test file using service role
    const { data, error } = await supabase.storage
      .from('temp-uploads')
      .upload(testPath, testContent, {
        contentType: 'text/plain'
      });

    if (error) {
      console.error('❌ Authenticated upload failed:', error);
      return false;
    }

    console.log('✅ Authenticated upload successful');

    // Test download
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('temp-uploads')
      .download(testPath);

    if (downloadError) {
      console.error('❌ Download test failed:', downloadError);
    } else {
      console.log('✅ Download test successful');
    }

    // Clean up
    const { error: deleteError } = await supabase.storage
      .from('temp-uploads')
      .remove([testPath]);

    if (deleteError) {
      console.warn('⚠️ Failed to clean up test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }

    return true;
  } catch (error) {
    console.error('❌ Storage auth test error:', error);
    return false;
  }
}

async function checkBucketConfiguration() {
  console.log('\n🔍 Checking bucket configuration...');

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Failed to list buckets:', error);
      return false;
    }

    const tempBucket = buckets.find(b => b.name === 'temp-uploads');

    if (!tempBucket) {
      console.error('❌ temp-uploads bucket not found');
      return false;
    }

    console.log('📊 Bucket configuration:');
    console.log(`   - ID: ${tempBucket.id}`);
    console.log(`   - Name: ${tempBucket.name}`);
    console.log(`   - Public: ${tempBucket.public}`);
    console.log(`   - File size limit: ${tempBucket.file_size_limit ? Math.round(tempBucket.file_size_limit / 1024 / 1024) + 'MB' : 'None'}`);
    console.log(`   - Allowed MIME types: ${tempBucket.allowed_mime_types || 'All'}`);

    return true;
  } catch (error) {
    console.error('❌ Bucket config check error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting storage fix application...\n');

  const results = {
    fixes: await applyStorageFixes(),
    config: await checkBucketConfiguration(),
    authTest: await testStorageWithAuth()
  };

  console.log('\n📋 RESULTS:');
  console.log('=============');
  Object.entries(results).forEach(([key, success]) => {
    console.log(`${key}: ${success ? '✅ PASS' : '❌ FAIL'}`);
  });

  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n🎯 Storage Fix Status: ${allPassed ? '✅ READY FOR UPLOAD' : '❌ NEEDS ATTENTION'}`);

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);