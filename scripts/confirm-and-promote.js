// Script to confirm email and promote user to admin (for development)
// Usage: node scripts/confirm-and-promote.js <email>

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Must use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function confirmAndPromoteUser(email) {
  if (!email) {
    console.error('Please provide an email address');
    console.log('Usage: node scripts/confirm-and-promote.js <email>');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is required for this operation');
    console.error('Please add it to your .env.local file');
    process.exit(1);
  }

  try {
    console.log(`Processing user: ${email}`);

    // Step 1: Get user from auth.users
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }

    const user = authUsers.users.find(u => u.email === email);

    if (!user) {
      console.error(`User not found in auth system: ${email}`);
      console.log('Make sure the user has signed up first');
      process.exit(1);
    }

    console.log(`Found user in auth: ${user.email}`);
    console.log(`Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);

    // Step 2: Confirm email if not confirmed
    if (!user.email_confirmed_at) {
      console.log('Confirming email...');

      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          email_confirm: true,
          email_confirmed_at: new Date().toISOString()
        }
      );

      if (updateError) {
        console.error('Error confirming email:', updateError);
        process.exit(1);
      }

      console.log('✅ Email confirmed!');
    }

    // Step 3: Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError);
      process.exit(1);
    }

    // Step 4: Create or update profile
    if (!profile) {
      console.log('Creating profile...');

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username,
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
          role: 'admin'
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        process.exit(1);
      }

      console.log('✅ Profile created with admin role!');
    } else {
      console.log('Updating profile to admin...');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        process.exit(1);
      }

      console.log('✅ Profile updated to admin role!');
    }

    console.log('\n🎉 Success! You can now:');
    console.log('1. Sign in with your email and password');
    console.log('2. Access https://localhost:3000/admin');
    console.log('\nNo email confirmation needed - account is ready to use!');

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];
confirmAndPromoteUser(email);