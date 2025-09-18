// Test Mixcloud API - Run this first to verify API access
// Run with: node test-mixcloud-api.js

async function testMixcloudAPI() {
  try {
    // Test public endpoint first (no auth needed)
    const response = await fetch('https://api.mixcloud.com/spartacus/');
    const data = await response.json();

    console.log('✅ Mixcloud API is accessible');
    console.log('Sample user data:', {
      username: data.username,
      name: data.name,
      city: data.city,
      country: data.country
    });

    // Test cloudcasts endpoint
    const showsResponse = await fetch('https://api.mixcloud.com/spartacus/cloudcasts/');
    const showsData = await showsResponse.json();

    console.log('✅ Shows endpoint works');
    console.log('Sample shows:', showsData.data?.slice(0, 2).map(show => ({
      name: show.name,
      url: show.url,
      created_time: show.created_time
    })));

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testMixcloudAPI();