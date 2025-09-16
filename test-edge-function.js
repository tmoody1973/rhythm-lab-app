// Simple test script to verify the edge function is working
const EDGE_FUNCTION_URL = 'https://iqzecpfmmsjooxuzvdgu.supabase.co/functions/v1/spinitron-proxy';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxemVjcGZtbXNqb294dXp2ZGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NzQwNzksImV4cCI6MjA3MzU1MDA3OX0.DJRURHmNVCQQfHnObjAsN9QyesDOZMPHGgpirXwqgaU';

async function testEdgeFunction() {
  console.log('🧪 Testing Edge Function...');

  const headers = {
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Get current songs (should fetch from Spinitron API and cache them)
    console.log('\n📡 Test 1: Fetching current songs from Spinitron API...');
    const response1 = await fetch(`${EDGE_FUNCTION_URL}?endpoint=spins&count=5&use_cache=false`, { headers });
    const data1 = await response1.json();

    if (response1.ok) {
      console.log('✅ API call successful!');
      console.log('📊 Got', data1.items?.length || 0, 'songs');
      if (data1.items?.[0]) {
        console.log('🎵 Latest song:', data1.items[0].artist, '-', data1.items[0].song);
      }
    } else {
      console.log('❌ API call failed:', data1.error);
      return;
    }

    // Test 2: Get same songs from cache (should be much faster)
    console.log('\n⚡ Test 2: Fetching same songs from database cache...');
    const startTime = Date.now();
    const response2 = await fetch(`${EDGE_FUNCTION_URL}?endpoint=spins&count=5&use_cache=true`, { headers });
    const data2 = await response2.json();
    const cacheTime = Date.now() - startTime;

    if (response2.ok) {
      console.log('✅ Cache call successful!');
      console.log('⚡ Cache response time:', cacheTime + 'ms');
      console.log('📊 Got', data2.items?.length || 0, 'cached songs');
    } else {
      console.log('❌ Cache call failed:', data2.error);
    }

    console.log('\n🎉 Edge function is working! Your app should now show real artist data.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure you:');
    console.log('   1. Added SPINITRON_API_KEY environment variable');
    console.log('   2. Edge function is deployed successfully');
    console.log('   3. Station config table exists in database');
  }
}

// Run the test
testEdgeFunction();