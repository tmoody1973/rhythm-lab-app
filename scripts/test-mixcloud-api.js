/**
 * Test script to manually call Mixcloud API with stored token
 * Run this to debug the 400 error
 */

const { createClient } = require('@supabase/supabase-js')

async function testMixcloudAPI() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  )

  try {
    // Get the stored token
    const { data: token, error } = await supabase
      .from('mixcloud_oauth_tokens')
      .select('access_token')
      .eq('user_id', '4caac7ca-1186-49f6-af80-a97ef33ac20c')
      .single()

    if (error || !token) {
      console.error('Failed to get token:', error)
      return
    }

    console.log('Token found, testing API call...')
    console.log('Token preview:', token.access_token.substring(0, 20) + '...')

    // Test the Mixcloud API call
    const response = await fetch('https://api.mixcloud.com/me/', {
      headers: {
        'Authorization': `Bearer ${token.access_token}`
      }
    })

    console.log('API Response Status:', response.status)
    console.log('API Response Headers:', Object.fromEntries(response.headers))

    const responseText = await response.text()
    console.log('API Response Body:', responseText)

    if (response.ok) {
      console.log('✅ API call successful!')
    } else {
      console.log('❌ API call failed with status:', response.status)
    }

  } catch (error) {
    console.error('Error testing API:', error)
  }
}

testMixcloudAPI()