const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  try {
    // Create a test admin user
    const email = 'admin@rhythmlabradio.com'
    const password = 'admin123456' // Change this to a secure password

    console.log('Creating admin user...')

    // Create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return
    }

    console.log('User created successfully:', authData.user.id)

    // Create or update the profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        username: 'admin',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return
    }

    console.log('Admin user created successfully!')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Please change the password after first login.')
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createAdminUser()