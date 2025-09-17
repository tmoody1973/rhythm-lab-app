const axios = require('axios');
const slugify = require('slugify');

// Configuration - YOU NEED TO ADD YOUR TOKENS HERE
const MANAGEMENT_TOKEN = 'QbfrdyHkL2AYU4TjKuCvSQtt-90824082004616-p7-hLGxi42xyMaxWskGe'; // Get this from Storyblok Settings > Access Tokens
const SPACE_ID = '287185477794349'; // Get this from your Storyblok space URL

const storyblokApi = axios.create({
  baseURL: 'https://mapi.storyblok.com/v1/',
  headers: {
    'Authorization': MANAGEMENT_TOKEN,
    'Content-Type': 'application/json',
  },
});

async function updateSlugs() {
  try {
    console.log('🔍 Fetching all stories from Storyblok...');

    const { data: { stories } } = await storyblokApi.get(`spaces/${SPACE_ID}/stories`, {
      params: {
        per_page: 100, // Adjust if you have more than 100 posts
      },
    });

    console.log(`📝 Found ${stories.length} stories. Processing...`);

    for (const story of stories) {
      // Check if story has a title field to generate slug from
      // Priority: content.title (main title field) > story.name (fallback)
      const title = story.content?.title || story.name;

      console.log(`📄 Processing "${story.name}"`);
      console.log(`   Content title: "${story.content?.title || 'none'}"`);
      console.log(`   Story name: "${story.name}"`);
      console.log(`   Using for slug: "${title}"`);
      console.log(`   Current slug: "${story.slug}"`);
      console.log('');

      if (title) {
        // Generate a clean URL-friendly slug
        const newSlug = slugify(title, {
          lower: true,     // Convert to lowercase
          strict: true,    // Remove special characters
          remove: /[*+~.()'"!:@]/g // Remove specific characters
        });

        // Only update if the slug has changed
        if (newSlug !== story.slug) {
          console.log(`🔄 Updating "${story.name}"`);
          console.log(`   Old slug: "${story.slug}"`);
          console.log(`   New slug: "${newSlug}"`);

          await storyblokApi.put(`spaces/${SPACE_ID}/stories/${story.id}`, {
            story: {
              slug: newSlug,
            },
          });

          console.log(`✅ Updated successfully!\n`);
        } else {
          console.log(`⏭️  Skipping "${story.name}" - slug already correct\n`);
        }
      } else {
        console.log(`⚠️  Skipping "${story.name}" - no title found\n`);
      }
    }

    console.log('🎉 Finished updating all slugs!');

  } catch (error) {
    console.error('❌ Error updating slugs:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.error('🔑 Authentication failed. Please check your Management API token.');
    }
    if (error.response?.status === 404) {
      console.error('🏠 Space not found. Please check your Space ID.');
    }
  }
}

// Run the script
updateSlugs();