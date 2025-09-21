/**
 * Fix RLS policies for favorites to work with Clerk user IDs
 *
 * Run this script to disable RLS on favorites and profiles tables
 * since we're handling auth in the API layer using Clerk
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function fixFavoritesRLS() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🔧 Fixing RLS policies for favorites...\n')

  try {
    // Run the migration SQL
    const migrationSQL = `
      -- Fix RLS policies for direct Clerk user ID usage
      -- Drop existing RLS policies
      DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
      DROP POLICY IF EXISTS "Users can create own favorites" ON user_favorites;
      DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorites;

      -- Disable RLS since we're using service role key and handling auth in API
      ALTER TABLE user_favorites DISABLE ROW LEVEL SECURITY;
      ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);
    `

    const { error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    }).single()

    // If the RPC doesn't exist, try running the statements individually
    if (error && error.message.includes('exec_sql')) {
      console.log('📝 Running migration statements individually...')

      // Since we can't run raw SQL directly, we'll document what needs to be done
      console.log('\n⚠️  MANUAL STEPS REQUIRED:')
      console.log('=' .repeat(50))
      console.log('\nPlease run the following SQL in your Supabase SQL editor:')
      console.log('(Go to https://supabase.com/dashboard → SQL Editor)\n')
      console.log(migrationSQL)
      console.log('\n' + '=' .repeat(50))
      console.log('\nThis will:')
      console.log('1. Drop the existing RLS policies that are causing issues')
      console.log('2. Disable RLS on user_favorites and profiles tables')
      console.log('3. Create indexes for better performance')
      console.log('\nAuth is handled in the API layer using Clerk, so RLS is not needed.')

      return
    }

    if (error) {
      console.error('❌ Error running migration:', error)
      return
    }

    console.log('✅ Successfully fixed RLS policies!')
    console.log('🎉 Favorites should now work properly with Clerk authentication')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the fix
fixFavoritesRLS()