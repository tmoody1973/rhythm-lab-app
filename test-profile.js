// Quick test to check if profile table is accessible
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testProfileAccess() {
  console.log('Testing profile table access...');

  try {
    // Test if we can query the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying profiles table:', error);
    } else {
      console.log('✅ Profiles table accessible');
      console.log('Sample data:', data);

      // Check if role column exists
      if (data.length > 0 && 'role' in data[0]) {
        console.log('✅ Role column exists');
      } else {
        console.log('❌ Role column missing - migration needed');
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testProfileAccess();