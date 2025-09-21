/**
 * Verify Admin Users Backup Completeness
 *
 * This script validates that the backup contains all necessary data
 * for the admin authentication migration.
 */

const fs = require('fs')
const path = require('path')

function verifyBackup() {
  console.log('🔍 Verifying admin users backup...\n')

  // Find the latest backup file
  const backupsDir = path.join(process.cwd(), 'backups')

  if (!fs.existsSync(backupsDir)) {
    console.error('❌ Backups directory not found!')
    return false
  }

  const backupFiles = fs.readdirSync(backupsDir)
    .filter(file => file.startsWith('admin-users-backup-') && file.endsWith('.json'))
    .sort()
    .reverse() // Most recent first

  if (backupFiles.length === 0) {
    console.error('❌ No backup files found!')
    return false
  }

  const latestBackup = backupFiles[0]
  const backupPath = path.join(backupsDir, latestBackup)

  console.log(`📁 Checking backup file: ${latestBackup}`)

  try {
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))

    console.log('\n✅ BACKUP DATA VERIFICATION:')
    console.log('=' .repeat(50))

    // Check backup structure
    const requiredFields = ['backup_date', 'backup_purpose', 'admin_profiles', 'auth_users', 'migration_notes']
    let structureValid = true

    requiredFields.forEach(field => {
      if (backupData[field] !== undefined) {
        console.log(`✅ ${field}: Present`)
      } else {
        console.log(`❌ ${field}: Missing`)
        structureValid = false
      }
    })

    if (!structureValid) {
      console.error('\n❌ Backup structure is incomplete!')
      return false
    }

    // Verify admin profiles data
    const adminProfiles = backupData.admin_profiles || []
    const authUsers = backupData.auth_users || []

    console.log(`\n📊 ADMIN PROFILES: ${adminProfiles.length} found`)
    console.log('=' .repeat(30))

    if (adminProfiles.length === 0) {
      console.log('⚠️  No admin profiles found - this might be expected if no admins exist')
    } else {
      let profilesValid = true

      adminProfiles.forEach((profile, index) => {
        console.log(`\n${index + 1}. ${profile.email || 'NO EMAIL'}`)

        // Check required profile fields
        const profileRequiredFields = ['id', 'email', 'role']
        profileRequiredFields.forEach(field => {
          if (profile[field]) {
            console.log(`   ✅ ${field}: ${profile[field]}`)
          } else {
            console.log(`   ❌ ${field}: Missing`)
            profilesValid = false
          }
        })

        // Verify it's actually an admin role
        if (!['admin', 'super_admin'].includes(profile.role)) {
          console.log(`   ⚠️  Unexpected role: ${profile.role}`)
        }

        // Check if matching auth user exists
        const matchingAuthUser = authUsers.find(user => user.id === profile.id)
        if (matchingAuthUser) {
          console.log(`   ✅ Auth data: Found (confirmed: ${matchingAuthUser.email_confirmed_at ? 'Yes' : 'No'})`)
          console.log(`   📅 Last login: ${matchingAuthUser.last_sign_in_at || 'Never'}`)
        } else {
          console.log(`   ⚠️  Auth data: Missing from auth.users`)
        }
      })

      if (!profilesValid) {
        console.error('\n❌ Some admin profiles have missing required data!')
        return false
      }
    }

    // Summary
    console.log('\n📋 MIGRATION READINESS SUMMARY:')
    console.log('=' .repeat(40))

    const activeAdmins = adminProfiles.filter(profile => {
      const authUser = authUsers.find(user => user.id === profile.id)
      return authUser && authUser.email_confirmed_at
    })

    console.log(`👥 Total admin accounts: ${adminProfiles.length}`)
    console.log(`✅ Confirmed email accounts: ${activeAdmins.length}`)
    console.log(`📧 Unique email addresses: ${[...new Set(adminProfiles.map(p => p.email))].length}`)

    // Check for potential issues
    const duplicateEmails = adminProfiles
      .map(p => p.email)
      .filter((email, index, arr) => arr.indexOf(email) !== index)

    if (duplicateEmails.length > 0) {
      console.log(`⚠️  Duplicate emails found: ${duplicateEmails.join(', ')}`)
    }

    const testAccounts = adminProfiles.filter(p =>
      p.email && (p.email.includes('test') || p.email.includes('example'))
    )

    if (testAccounts.length > 0) {
      console.log(`🧪 Test accounts detected: ${testAccounts.length}`)
      testAccounts.forEach(acc => console.log(`   - ${acc.email}`))
    }

    // Production readiness check
    const productionAccounts = adminProfiles.filter(p =>
      p.email && !p.email.includes('test') && !p.email.includes('example')
    )

    console.log(`\n🚀 PRODUCTION ACCOUNTS: ${productionAccounts.length}`)
    productionAccounts.forEach(acc => {
      const authUser = authUsers.find(u => u.id === acc.id)
      const lastLogin = authUser?.last_sign_in_at
      const recentLogin = lastLogin && new Date(lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      console.log(`   📧 ${acc.email} ${recentLogin ? '🟢 (active)' : '🟡 (inactive)'}`)
    })

    console.log('\n✅ Backup verification completed successfully!')
    console.log(`📁 Backup file is valid and ready for migration`)

    return true

  } catch (error) {
    console.error('❌ Error reading backup file:', error.message)
    return false
  }
}

// Run verification
const isValid = verifyBackup()
process.exit(isValid ? 0 : 1)