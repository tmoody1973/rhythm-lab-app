// Server Components friendly setup with error handling
import { apiPlugin, storyblokInit, getStoryblokApi } from '@storyblok/react/rsc';

const accessToken = process.env.NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN ||
                   process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN ||
                   process.env.STORYBLOK_ACCESS_TOKEN;

if (!accessToken) {
  // Surface a helpful error early (during boot)
  console.warn('[Storyblok] Missing access token. Check environment variables.');
}

// Initialize Storyblok with error handling
let storyblokInitialized = false;
try {
  storyblokInit({
    accessToken,
    use: [apiPlugin],
    apiOptions: {
      // Set this to 'us' if your Space is in the US; otherwise use 'eu' (default).
      region: process.env.STORYBLOK_REGION || 'eu',
    },
  });
  storyblokInitialized = true;
} catch (error) {
  console.error('[Storyblok] Initialization error:', error);
  storyblokInitialized = false;
}

// Helper for API calls with error handling
export function sb() {
  try {
    if (!storyblokInitialized) {
      throw new Error('Storyblok not properly initialized');
    }
    return getStoryblokApi();
  } catch (error) {
    console.error('[Storyblok] API error:', error);
    // Return a mock API that prevents crashes
    return {
      get: async () => ({ data: { stories: [] } })
    };
  }
}

// Helper to get proper API options for development vs production
export function getStoryblokOptions(additionalOptions = {}) {
  const isDev = process.env.NODE_ENV === 'development';
  const options = {
    ...additionalOptions
  };

  // Set version explicitly to match Storyblok API types
  options.version = isDev ? 'draft' : 'published';

  // Add cache busting in development only
  if (isDev) {
    options.cv = Date.now();
  }

  return options;
}