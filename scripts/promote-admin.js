// Script to promote a user to admin role
// Usage: node scripts/promote-admin.js <email>

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function promoteUserToAdmin(email) {
  if (!email) {
    console.error('Please provide an email address');
    console.log('Usage: node scripts/promote-admin.js <email>');
    process.exit(1);
  }

  try {
    console.log(`Looking up user with email: ${email}`);

    // Find the user by email
    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (selectError) {
      if (selectError.code === 'PGRST116') {
        console.error(`No user found with email: ${email}`);
        console.log('Please make sure the user has created an account first.');
      } else {
        console.error('Error finding user:', selectError);
      }
      process.exit(1);
    }

    console.log(`Found user: ${profile.username || profile.email}`);
    console.log(`Current role: ${profile.role}`);

    // Update the user's role to admin
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', email)
      .select();

    if (updateError) {
      console.error('Error updating user role:', updateError);
      process.exit(1);
    }

    console.log('✅ Successfully promoted user to admin!');
    console.log(`User ${email} can now access /admin routes`);
    console.log('They may need to sign out and sign back in for changes to take effect.');

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];
promoteUserToAdmin(email);