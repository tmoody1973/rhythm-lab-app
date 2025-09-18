// Test the Mixcloud import API endpoint
// Run with: node test-import-api.js

// Sample test data
const testShowData = {
  title: "Test Show Import",
  description: "A test show to verify the import endpoint works correctly",
  date: "2024-01-15T00:00:00Z",
  mixcloud_url: "https://www.mixcloud.com/username/test-show/",
  embed_code: '<iframe width="100%" height="60" src="https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=%2Fusername%2Ftest-show%2F" frameborder="0" ></iframe>',
  cover_image: "https://thumbnailer.mixcloud.com/unsafe/300x300/profile:7c0e/1a8c12e02d8b4d0a9b5c6d7e8f9a0b1c.jpg",
  duration: 3600,
  playlist_text: `HOUR 1
Bonobo - Black Sands
Thievery Corporation - Lebanese Blonde
Nujabes - Aruarian Dance

HOUR 2
RJD2 - Ghostwriter
Blockhead - The Music Scene
Prefuse 73 - One Word Extinguisher`,
  slug: "test-show-import-2024-01-15",
  status: "draft" // Use draft for testing
}

// Test without authentication (should fail)
async function testUnauthorized() {
  console.log('🔒 Testing unauthorized access...')

  try {
    const response = await fetch('https://localhost:3000/api/mixcloud/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testShowData)
    })

    const result = await response.json()

    if (response.status === 401) {
      console.log('   ✅ Correctly rejected unauthorized request')
      console.log('   📄 Response:', result)
    } else {
      console.log('   ❌ Should have returned 401, got:', response.status)
      console.log('   📄 Response:', result)
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message)
  }
}

// Test with authentication (requires manual cookie setup)
async function testAuthorized() {
  console.log('\n🔐 Testing authorized access...')
  console.log('   ⚠️  This test requires manual setup:')
  console.log('   1. Log in to your app as admin user')
  console.log('   2. Open browser dev tools')
  console.log('   3. Copy the session cookies')
  console.log('   4. Add them to the cookie header below')
  console.log('   5. Uncomment and run this test')

  // Uncomment and add your session cookies here:
  /*
  const cookies = 'sb-access-token=your-token-here; sb-refresh-token=your-refresh-token-here'

  try {
    const response = await fetch('https://localhost:3000/api/mixcloud/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(testShowData)
    })

    const result = await response.json()

    console.log('   📊 Status:', response.status)
    console.log('   📄 Response:', JSON.stringify(result, null, 2))

    if (result.success) {
      console.log('   ✅ Import successful!')
      console.log('   🆔 Show ID:', result.show_id)
      console.log('   🎵 Tracks imported:', result.tracks_imported)
    } else {
      console.log('   ❌ Import failed')
      console.log('   🔍 Errors:', result.errors)
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message)
  }
  */
}

// Test validation errors
async function testValidation() {
  console.log('\n📋 Testing validation...')

  const invalidData = {
    title: "Missing Required Fields"
    // Missing date, mixcloud_url, playlist_text
  }

  try {
    const response = await fetch('https://localhost:3000/api/mixcloud/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData)
    })

    const result = await response.json()

    if (response.status === 400) {
      console.log('   ✅ Correctly validated required fields')
      console.log('   📄 Response:', result)
    } else {
      console.log('   ❌ Should have returned 400, got:', response.status)
      console.log('   📄 Response:', result)
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message)
  }
}

// Test sync endpoint
async function testSyncEndpoint() {
  console.log('\n🔄 Testing sync endpoint...')

  try {
    // Test GET sync status (should fail without auth)
    const response = await fetch('https://localhost:3000/api/mixcloud/sync?show_id=test-id', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()

    if (response.status === 401) {
      console.log('   ✅ Sync endpoint correctly requires authentication')
      console.log('   📄 Response:', result)
    } else {
      console.log('   ❌ Should have returned 401, got:', response.status)
      console.log('   📄 Response:', result)
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message)
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Mixcloud Import API Endpoints\n')

  await testUnauthorized()
  await testAuthorized()
  await testValidation()
  await testSyncEndpoint()

  console.log('\n✅ API endpoint tests completed!')
  console.log('\n📝 Next steps:')
  console.log('1. Set up admin authentication in your browser')
  console.log('2. Copy session cookies to test authorized requests')
  console.log('3. Test actual import with real show data')
  console.log('4. Verify database and Storyblok integration')
}

// Handle self-signed certificate for localhost testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0

runTests().catch(console.error)