/**
 * PHASE 1: Backup Admin Users from Supabase
 *
 * This script exports all admin and super_admin users from Supabase
 * before migrating to Clerk authentication.
 *
 * Usage: node scripts/backup-admin-users.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Initialize Supabase client with service role key (has admin access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function backupAdminUsers() {
  try {
    console.log('🔍 Searching for admin users in Supabase...\n')

    // Query all users with admin or super_admin roles
    const { data: adminProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: true })

    if (profileError) {
      throw new Error(`Error fetching admin profiles: ${profileError.message}`)
    }

    console.log(`📊 Found ${adminProfiles?.length || 0} admin users in profiles table`)

    // Also get auth.users data for complete backup
    const adminUserIds = adminProfiles?.map(profile => profile.id) || []
    let authUsers = []

    if (adminUserIds.length > 0) {
      // Note: This requires service role key to access auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

      if (authError) {
        console.warn(`⚠️  Could not fetch auth.users data: ${authError.message}`)
        console.log('   Continuing with profiles data only...')
      } else {
        // Filter auth users to only include admin user IDs
        authUsers = authData.users.filter(user => adminUserIds.includes(user.id))
        console.log(`🔐 Found ${authUsers.length} matching users in auth.users table`)
      }
    }

    // Create backup data structure
    const backupData = {
      backup_date: new Date().toISOString(),
      backup_purpose: 'Admin auth migration from Supabase to Clerk',
      admin_profiles: adminProfiles || [],
      auth_users: authUsers,
      migration_notes: [
        'These users need to be recreated in Clerk with admin roles',
        'Original passwords cannot be migrated - users will need new passwords',
        'Email addresses should remain the same for continuity'
      ]
    }

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true })
    }

    // Save backup to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFileName = `admin-users-backup-${timestamp}.json`
    const backupFilePath = path.join(backupsDir, backupFileName)

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2))

    console.log(`\n✅ Backup completed successfully!`)
    console.log(`📁 Backup saved to: ${backupFilePath}`)

    // Display summary
    console.log('\n📋 ADMIN USERS SUMMARY:')
    console.log('=' .repeat(50))

    if (adminProfiles && adminProfiles.length > 0) {
      adminProfiles.forEach((profile, index) => {
        console.log(`${index + 1}. Email: ${profile.email}`)
        console.log(`   Role: ${profile.role}`)
        console.log(`   Username: ${profile.username || 'Not set'}`)
        console.log(`   Full Name: ${profile.full_name || 'Not set'}`)
        console.log(`   Created: ${profile.created_at}`)
        console.log(`   ID: ${profile.id}`)
        console.log('')
      })
    } else {
      console.log('❗ No admin users found in the database.')
      console.log('   This could mean:')
      console.log('   - No admin users have been created yet')
      console.log('   - Admin users exist in auth.users but not in profiles table')
      console.log('   - There might be a database connection issue')
    }

    console.log('\n🔧 NEXT STEPS:')
    console.log('1. Review the backup file to ensure all admin users are captured')
    console.log('2. Set up admin roles in Clerk dashboard')
    console.log('3. Create new admin accounts in Clerk using the email addresses above')
    console.log('4. Test new Clerk admin accounts before removing Supabase auth')

    return backupData

  } catch (error) {
    console.error('❌ Backup failed:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('- Check that SUPABASE_SERVICE_ROLE_KEY is set in .env.local')
    console.error('- Verify Supabase URL and credentials are correct')
    console.error('- Ensure the profiles table exists and has data')
    process.exit(1)
  }
}

// Run the backup
backupAdminUsers()