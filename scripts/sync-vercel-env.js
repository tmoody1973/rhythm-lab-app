/**
 * Sync missing environment variables to Vercel using env file
 */

const fs = require('fs');
const { spawn } = require('child_process');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
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

function addEnvVar(key, value) {
  return new Promise((resolve, reject) => {
    console.log(`Adding ${key} to Vercel...`);

    const child = spawn('vercel', ['env', 'add', key, 'production'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${key} added successfully`);
        resolve();
      } else {
        console.error(`❌ Failed to add ${key}:`, error);
        reject(new Error(error));
      }
    });

    // Send the value when prompted
    child.stdin.write(value + '\n');
    child.stdin.end();
  });
}

async function syncEnvironmentVariables() {
  console.log('🔄 Syncing environment variables to Vercel...\n');

  const localVars = parseEnvFile('.env.local');
  const vercelVars = parseEnvFile('.env.vercel');

  const missingVars = {
    'STREAMGUYS_API_KEY': localVars['STREAMGUYS_API_KEY'],
    'STREAMGUYS_MONITOR_UUID': localVars['STREAMGUYS_MONITOR_UUID'],
    'CLERK_ADMIN_ROLE': localVars['CLERK_ADMIN_ROLE'],
    'STORYBLOK_REGION': localVars['STORYBLOK_REGION'],
    'OPENAI_API_KEY': localVars['OPENAI_API_KEY']
  };

  // Filter out undefined values
  const varsToAdd = Object.entries(missingVars).filter(([key, value]) => value);

  console.log(`📋 Found ${varsToAdd.length} variables to add:`);
  varsToAdd.forEach(([key, value]) => {
    console.log(`   - ${key}: ${value.slice(0, 20)}...`);
  });
  console.log();

  // Add variables one by one
  for (const [key, value] of varsToAdd) {
    try {
      await addEnvVar(key, value);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay between requests
    } catch (error) {
      console.error(`Failed to add ${key}:`, error.message);
    }
  }

  console.log('\n✅ Environment sync completed!');

  // Update the .env.vercel file to reflect the new state
  const updatedVercelVars = { ...vercelVars, ...Object.fromEntries(varsToAdd) };
  const envContent = Object.entries(updatedVercelVars)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');

  fs.writeFileSync('.env.vercel', `# Created by Vercel CLI\n${envContent}\n`);
  console.log('📝 Updated .env.vercel file');
}

async function main() {
  try {
    await syncEnvironmentVariables();
    console.log('\n🎯 Vercel environment is now ready for deployment!');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);