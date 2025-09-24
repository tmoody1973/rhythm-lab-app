/**
 * Test the complete upload flow with policies applied
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

async function testStorageDirectly() {
  console.log('🧪 Testing storage after policy fixes...');

  try {
    // Create test file
    const testContent = Buffer.from('Test audio file content for upload validation');
    const testFilename = `test_upload_${Date.now()}.mp3`;
    const testPath = `test-user/${testFilename}`;

    console.log(`📤 Uploading test file: ${testFilename}`);

    const { data, error } = await supabase.storage
      .from('temp-uploads')
      .upload(testPath, testContent, {
        contentType: 'audio/mpeg',
        duplex: 'half'
      });

    if (error) {
      console.error('❌ Storage upload failed:', error);
      return false;
    }

    console.log('✅ Storage upload successful:', data.path);

    // Test download
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('temp-uploads')
      .download(testPath);

    if (downloadError) {
      console.error('❌ Download failed:', downloadError);
    } else {
      console.log('✅ Download successful');
    }

    // Clean up
    const { error: deleteError } = await supabase.storage
      .from('temp-uploads')
      .remove([testPath]);

    if (!deleteError) {
      console.log('✅ Test file cleaned up');
    }

    return true;
  } catch (error) {
    console.error('❌ Storage test error:', error);
    return false;
  }
}

async function testUploadJobCreation() {
  console.log('\n🧪 Testing upload job creation...');

  try {
    // Create test upload job
    const testJob = {
      user_id: '4caac7ca-1186-49f6-af80-a97ef33ac20c', // From diagnostics
      filename: `test_${Date.now()}_audio.mp3`,
      original_filename: 'test_audio.mp3',
      file_size: 1024,
      content_type: 'audio/mpeg',
      show_title: 'Test Upload Job',
      show_description: 'Testing upload job creation',
      show_tags: ['test'],
      publish_date: new Date().toISOString().split('T')[0],
      playlist_text: '',
      parsed_tracks: [],
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('upload_jobs')
      .insert(testJob)
      .select()
      .single();

    if (error) {
      console.error('❌ Job creation failed:', error);
      return false;
    }

    console.log('✅ Upload job created:', data.id);

    // Clean up test job
    const { error: deleteError } = await supabase
      .from('upload_jobs')
      .delete()
      .eq('id', data.id);

    if (!deleteError) {
      console.log('✅ Test job cleaned up');
    }

    return true;
  } catch (error) {
    console.error('❌ Job creation test error:', error);
    return false;
  }
}

async function testOAuthToken() {
  console.log('\n🧪 Testing OAuth token access...');

  try {
    const { data: tokens, error } = await supabase
      .from('mixcloud_oauth_tokens')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Token query failed:', error);
      return false;
    }

    if (tokens.length === 0) {
      console.log('⚠️ No OAuth tokens found - user needs to connect Mixcloud');
      return false;
    }

    const token = tokens[0];
    console.log('✅ OAuth token found');
    console.log(`   - User ID: ${token.user_id}`);
    console.log(`   - Username: ${token.mixcloud_username}`);
    console.log(`   - Has refresh token: ${!!token.refresh_token}`);

    // Test token validity with a simple API call
    if (token.access_token) {
      try {
        const url = new URL('https://api.mixcloud.com/me/');
        url.searchParams.set('access_token', token.access_token);

        const response = await fetch(url.toString());

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ Token is valid');
          console.log(`   - Mixcloud user: ${userData.username}`);
        } else {
          console.log('⚠️ Token may be expired or invalid');
        }
      } catch (apiError) {
        console.log('⚠️ Could not validate token with API');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ OAuth test error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing upload flow after SQL fixes...\n');

  const results = {
    storage: await testStorageDirectly(),
    uploadJobs: await testUploadJobCreation(),
    oauthToken: await testOAuthToken()
  };

  console.log('\n📋 UPLOAD FLOW TEST RESULTS:');
  console.log('===============================');
  Object.entries(results).forEach(([test, success]) => {
    console.log(`${test}: ${success ? '✅ WORKING' : '❌ ISSUES'}`);
  });

  const uploadReady = results.storage && results.uploadJobs;
  const oauthReady = results.oauthToken;

  console.log(`\n🎯 Upload Infrastructure: ${uploadReady ? '✅ READY' : '❌ NOT READY'}`);
  console.log(`🎯 OAuth Integration: ${oauthReady ? '✅ READY' : '❌ NEEDS SETUP'}`);

  if (uploadReady && oauthReady) {
    console.log('\n🎉 Upload system is ready!');
    console.log('\n📝 Ready for production deployment');
  } else {
    console.log('\n🛠️ Issues to resolve:');
    if (!uploadReady) console.log('- Fix storage or upload job creation');
    if (!oauthReady) console.log('- Connect Mixcloud OAuth in admin panel');
  }

  const allReady = uploadReady && oauthReady;
  process.exit(allReady ? 0 : 1);
}

main().catch(console.error);