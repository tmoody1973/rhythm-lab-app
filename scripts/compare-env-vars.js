/**
 * Compare local and Vercel environment variables to ensure completeness
 */

const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').replace(/^["']|["']$/g, '');
      }
    }
  });

  return vars;
}

function compareEnvironments() {
  console.log('🔍 Comparing environment configurations...\n');

  const localVars = parseEnvFile('.env.local');
  const vercelVars = parseEnvFile('.env.vercel');

  console.log(`📊 Local environment variables: ${Object.keys(localVars).length}`);
  console.log(`📊 Vercel environment variables: ${Object.keys(vercelVars).length}\n`);

  // Find variables in local but not in Vercel
  const missingInVercel = Object.keys(localVars).filter(key => !(key in vercelVars));

  // Find variables in Vercel but not in local
  const missingInLocal = Object.keys(vercelVars).filter(key => !(key in localVars));

  // Check for value differences (excluding dynamic tokens)
  const dynamicKeys = ['VERCEL_OIDC_TOKEN', 'DATABASE_URL'];
  const different = [];

  Object.keys(localVars).forEach(key => {
    if (key in vercelVars && !dynamicKeys.includes(key)) {
      if (localVars[key] !== vercelVars[key]) {
        different.push(key);
      }
    }
  });

  // Report findings
  if (missingInVercel.length > 0) {
    console.log('❌ Variables missing in Vercel:');
    missingInVercel.forEach(key => {
      console.log(`   - ${key}: ${localVars[key].slice(0, 20)}${localVars[key].length > 20 ? '...' : ''}`);
    });
    console.log();
  }

  if (missingInLocal.length > 0) {
    console.log('⚠️ Variables only in Vercel (may be Vercel-specific):');
    missingInLocal.forEach(key => {
      console.log(`   - ${key}`);
    });
    console.log();
  }

  if (different.length > 0) {
    console.log('⚠️ Variables with different values:');
    different.forEach(key => {
      console.log(`   - ${key}`);
    });
    console.log();
  }

  // Critical variables check
  const criticalVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'MIXCLOUD_CLIENT_ID',
    'MIXCLOUD_CLIENT_SECRET',
    'NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN',
    'STORYBLOK_MANAGEMENT_TOKEN',
    'OPENAI_API_KEY'
  ];

  console.log('🔑 Critical variables status:');
  criticalVars.forEach(key => {
    const inLocal = key in localVars;
    const inVercel = key in vercelVars;
    const status = inLocal && inVercel ? '✅' : inLocal ? '⚠️ LOCAL ONLY' : inVercel ? '⚠️ VERCEL ONLY' : '❌ MISSING';
    console.log(`   ${key}: ${status}`);
  });

  // Summary
  const deploymentReady = missingInVercel.length === 0 && criticalVars.every(key => key in vercelVars);

  console.log('\n📋 DEPLOYMENT READINESS:');
  console.log('========================');
  console.log(`Environment sync: ${missingInVercel.length === 0 ? '✅ SYNCED' : '❌ MISSING VARIABLES'}`);
  console.log(`Critical variables: ${criticalVars.every(key => key in vercelVars) ? '✅ PRESENT' : '❌ INCOMPLETE'}`);
  console.log(`Overall status: ${deploymentReady ? '✅ READY FOR DEPLOYMENT' : '❌ NEEDS ATTENTION'}`);

  if (!deploymentReady && missingInVercel.length > 0) {
    console.log('\n📝 Command to add missing variables to Vercel:');
    missingInVercel.forEach(key => {
      console.log(`vercel env add ${key}`);
    });
  }

  return deploymentReady;
}

const ready = compareEnvironments();
process.exit(ready ? 0 : 1);