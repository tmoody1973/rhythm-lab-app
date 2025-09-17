// Simple Node.js script to test Storyblok API connection
const { StoryblokApi } = require('storyblok-js-client');
require('dotenv').config({ path: '.env.local' });

async function testStoryblokConnection() {
  console.log('Testing Storyblok API connection...');
  console.log('Access Token:', process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN ? 'Found' : 'Missing');

  try {
    const storyblokApi = new StoryblokApi({
      accessToken: process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN,
    });

    // Test connection by getting space information
    const response = await storyblokApi.get('cdn/spaces/me');

    console.log('✅ Storyblok API connection successful!');
    console.log('Space Name:', response.data.space.name);
    console.log('Space Domain:', response.data.space.domain);
    console.log('Space ID:', response.data.space.id);

    // Test getting stories
    const storiesResponse = await storyblokApi.get('cdn/stories', {
      version: 'draft',
      per_page: 5
    });

    console.log(`📄 Found ${storiesResponse.data.stories.length} stories`);
    storiesResponse.data.stories.forEach(story => {
      console.log(`- ${story.name} (${story.content_type})`);
    });

  } catch (error) {
    console.error('❌ Storyblok API connection failed:', error.message);
    process.exit(1);
  }
}

testStoryblokConnection();