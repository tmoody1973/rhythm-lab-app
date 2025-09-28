const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SPACE_ID = '287185477794349';
const ACCESS_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN; // You'll need to set this

const BASE_URL = `https://mapi.storyblok.com/v1/spaces/${SPACE_ID}/components`;

async function createComponent(componentData) {
  try {
    const response = await axios.post(BASE_URL, {
      component: componentData
    }, {
      headers: {
        'Authorization': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Created component: ${componentData.name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error creating ${componentData.name}:`, error.response?.data || error.message);
    return null;
  }
}

async function createAllComponents() {
  console.log('Creating Storyblok components...\n');

  // Order matters - create nestable components first
  const componentFiles = [
    'service_card.json',
    'community_card.json',
    'contact_item.json',
    'cta_button.json',
    'hero_section.json',
    'mission_section.json',
    'host_section.json',
    'what_we_do_section.json',
    'philosophy_section.json',
    'community_image_section.json',
    'community_section.json',
    'partner_stations_section.json',
    'contact_section.json',
    'footer_cta_section.json',
    'about_page.json'
  ];

  for (const fileName of componentFiles) {
    const filePath = path.join(__dirname, 'storyblok-components', fileName);

    if (fs.existsSync(filePath)) {
      const componentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      await createComponent(componentData);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      console.log(`⚠️  File not found: ${fileName}`);
    }
  }

  console.log('\n🎉 Finished creating components!');
}

if (!ACCESS_TOKEN) {
  console.error('❌ Error: STORYBLOK_MANAGEMENT_TOKEN environment variable is required');
  console.log('Please set your Storyblok Management API token:');
  console.log('export STORYBLOK_MANAGEMENT_TOKEN="your_token_here"');
  process.exit(1);
}

createAllComponents().catch(console.error);