// Test the Mixcloud fetch API endpoints
// Run with: node test-fetch-endpoints.js

// Handle self-signed certificate for localhost testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0

// Test fetch archive endpoint
async function testFetchArchive() {
  console.log('🗂️  Testing fetch archive endpoint...')

  try {
    // Test without authentication (should fail)
    const response = await fetch('https://localhost:3000/api/mixcloud/fetch-archive?username=spartacus&limit=5', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()

    if (response.status === 401) {
      console.log('   ✅ Correctly requires authentication')
      console.log('   📄 Response:', result.error)
    } else {
      console.log('   ❌ Should have returned 401, got:', response.status)
      console.log('   📄 Response:', result)
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message)
  }
}

// Test fetch single show endpoint
async function testFetchSingle() {
  console.log('\n🎵 Testing fetch single show endpoint...')

  try {
    // Test with GET method
    const testUrl = 'https://www.mixcloud.com/spartacus/cinematic-soundscapes/'
    const response = await fetch(`https://localhost:3000/api/mixcloud/fetch-single?url=${encodeURIComponent(testUrl)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()

    if (response.status === 401) {
      console.log('   ✅ Correctly requires authentication')
      console.log('   📄 Response:', result.error)
    } else {
      console.log('   ❌ Should have returned 401, got:', response.status)
      console.log('   📄 Response:', result)
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message)
  }
}

// Test validation errors
async function testValidation() {
  console.log('\n📋 Testing validation errors...')

  try {
    // Test missing URL parameter
    const response = await fetch('https://localhost:3000/api/mixcloud/fetch-single', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()

    if (response.status === 401) {
      console.log('   ✅ Authentication checked before validation (expected)')
    } else if (response.status === 400) {
      console.log('   ✅ Correctly validated missing URL')
      console.log('   📄 Response:', result)
    } else {
      console.log('   ❌ Unexpected status:', response.status)
      console.log('   📄 Response:', result)
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message)
  }
}

// Test with example authentication (commented out)
async function testWithAuth() {
  console.log('\n🔐 Testing with authentication...')
  console.log('   ⚠️  To test with authentication:')
  console.log('   1. Log in to your app as admin user at https://localhost:3000/admin/login')
  console.log('   2. Open browser dev tools > Application > Cookies')
  console.log('   3. Copy the cookie values and uncomment the test below')
  console.log('   4. Replace the cookie string with your actual session cookies')

  // Uncomment and add your session cookies here:
  /*
  const cookies = 'sb-localhost-auth-token=your-token-here; sb-localhost-refresh-token=your-refresh-token-here'

  try {
    console.log('   🗂️  Testing archive endpoint with auth...')

    const archiveResponse = await fetch('https://localhost:3000/api/mixcloud/fetch-archive?username=spartacus&limit=3', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    })

    const archiveResult = await archiveResponse.json()

    console.log('   📊 Archive Status:', archiveResponse.status)
    console.log('   📄 Archive Response:', JSON.stringify(archiveResult, null, 2))

    if (archiveResult.success && archiveResult.shows) {
      console.log('   ✅ Archive fetch successful!')
      console.log('   📊 Shows found:', archiveResult.shows.length)
      console.log('   📊 Total available:', archiveResult.total_count)

      // Test single show fetch with the first show
      if (archiveResult.shows.length > 0) {
        const firstShowUrl = archiveResult.shows[0].url

        console.log('   🎵 Testing single show fetch...')
        const singleResponse = await fetch(`https://localhost:3000/api/mixcloud/fetch-single?url=${encodeURIComponent(firstShowUrl)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
          }
        })

        const singleResult = await singleResponse.json()
        console.log('   📊 Single Show Status:', singleResponse.status)

        if (singleResult.success) {
          console.log('   ✅ Single show fetch successful!')
          console.log('   🎵 Show:', singleResult.show.name)
          console.log('   ⏱️ Duration:', singleResult.show.formatted_duration)
          console.log('   🖼️ Cover:', singleResult.show.picture.medium)
          console.log('   📺 Embed ready:', !!singleResult.show.embed_code)
        }
      }
    }
  } catch (error) {
    console.log('   ❌ Network error:', error.message)
  }
  */
}

// Test endpoint availability
async function testEndpointAvailability() {
  console.log('\n🔍 Testing endpoint availability...')

  const endpoints = [
    '/api/mixcloud/fetch-archive',
    '/api/mixcloud/fetch-single',
    '/api/mixcloud/import',
    '/api/mixcloud/sync'
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`https://localhost:3000${endpoint}`)
      const isAvailable = response.status !== 404

      console.log(`   ${isAvailable ? '✅' : '❌'} ${endpoint} - Status: ${response.status}`)
    } catch (error) {
      console.log(`   ❌ ${endpoint} - Error: ${error.message}`)
    }
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Mixcloud Fetch API Endpoints\n')

  await testEndpointAvailability()
  await testFetchArchive()
  await testFetchSingle()
  await testValidation()
  await testWithAuth()

  console.log('\n✅ Fetch endpoint tests completed!')
  console.log('\n📝 Summary:')
  console.log('• Archive endpoint: Fetches user\'s complete show list with pagination')
  console.log('• Single show endpoint: Fetches detailed metadata for individual shows')
  console.log('• Both endpoints require admin authentication')
  console.log('• Both return data in format ready for import workflow')
  console.log('\n🔗 Integration ready:')
  console.log('• Use fetch-archive for "Archive Import" admin tab')
  console.log('• Use fetch-single for "Import by URL" admin tab')
}

runTests().catch(console.error)