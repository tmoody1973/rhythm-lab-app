/**
 * Apply migration 019 to fix Mixcloud OAuth table structure
 * This connects directly to the remote Supabase instance
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  })

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '019_fix_mixcloud_oauth_for_profiles.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('Applying migration 019...')
    console.log('Migration content:', migrationSQL.substring(0, 200) + '...')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }

    console.log('Migration 019 applied successfully!')
    console.log('Result:', data)

  } catch (error) {
    console.error('Error applying migration:', error)
    process.exit(1)
  }
}

applyMigration()