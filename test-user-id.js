// Test the specific user ID that's failing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSpecificUserId() {
  const userId = '4caac7ca-1186-49f6-af80-a97ef33ac20c';

  console.log(`Testing profile fetch for user ID: ${userId}`);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
    } else {
      console.log('✅ Profile found:', data);
    }

    // Also check if user exists in auth
    console.log('\nChecking auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Auth error:', authError);
    } else {
      const user = authUsers.users.find(u => u.id === userId);
      if (user) {
        console.log('✅ User found in auth:', user.email);
      } else {
        console.log('❌ User not found in auth system');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSpecificUserId();