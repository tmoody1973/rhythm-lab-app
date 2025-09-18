// Test specific user query that's failing in auth context
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSpecificUserQuery() {
  console.log('Testing specific user query...');

  try {
    // First, let's see what users exist
    console.log('1. Listing all profiles...');
    const { data: allProfiles, error: listError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5);

    if (listError) {
      console.error('❌ Error listing profiles:', listError);
      return;
    }

    console.log('All profiles:', allProfiles);

    if (allProfiles.length === 0) {
      console.log('No profiles found');
      return;
    }

    // Test querying the first user by ID
    const testUserId = allProfiles[0].id;
    console.log(`\n2. Testing query for specific user ID: ${testUserId}`);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (error) {
      console.error('❌ Error querying specific user:', error);
    } else {
      console.log('✅ Specific user query successful:', data);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSpecificUserQuery();