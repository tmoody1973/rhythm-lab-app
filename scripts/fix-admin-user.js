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

async function fixAdminUser() {
  try {
    const email = 'admin@rhythmlabradio.com'

    console.log('Checking for existing admin user...')

    // First, check if the user exists in auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return
    }

    const existingUser = users.find(u => u.email === email)

    if (!existingUser) {
      console.log('Admin user does not exist. Creating...')

      // Create the user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: 'admin123456',
        email_confirm: true
      })

      if (authError) {
        console.error('Error creating user:', authError)
        return
      }

      console.log('User created:', authData.user.id)

      // Create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          username: 'admin',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
      } else {
        console.log('Profile created successfully')
      }
    } else {
      console.log('Admin user exists:', existingUser.id)

      // Check if profile exists
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', existingUser.id)
        .single()

      if (profileFetchError && profileFetchError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Profile does not exist. Creating...')

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: existingUser.id,
            email,
            username: 'admin',
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error creating profile:', insertError)
        } else {
          console.log('Profile created successfully')
        }
      } else if (profile) {
        // Profile exists, check if it has admin role
        console.log('Current profile:', profile)

        if (profile.role !== 'admin') {
          console.log('Updating role to admin...')

          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin', updated_at: new Date().toISOString() })
            .eq('id', existingUser.id)

          if (updateError) {
            console.error('Error updating role:', updateError)
          } else {
            console.log('Role updated to admin successfully')
          }
        } else {
          console.log('User already has admin role')
        }
      }
    }

    console.log('\n✅ Admin user setup complete!')
    console.log('Email:', email)
    console.log('Password: admin123456')
    console.log('\nYou can now login at /admin')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

fixAdminUser()