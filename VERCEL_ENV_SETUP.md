# Vercel Environment Variables Setup

## Required Environment Variables

The following environment variables need to be added to your Vercel deployment to fix the "Unauthorized" errors:

### 1. PERPLEXITY_API_KEY (CRITICAL - Currently Missing)
- **Purpose**: AI content generation with real-time web search
- **Error when missing**: "Perplexity API error: Unauthorized"
- **How to get**: Sign up at https://www.perplexity.ai/api and get your API key

## How to Add Environment Variables to Vercel

1. **Go to Vercel Dashboard**
   - Navigate to https://vercel.com/dashboard
   - Select your project (`rhythm-lab-app`)

2. **Access Settings**
   - Click on the "Settings" tab
   - Navigate to "Environment Variables" in the left sidebar

3. **Add PERPLEXITY_API_KEY**
   - Click "Add New"
   - Name: `PERPLEXITY_API_KEY`
   - Value: (paste your Perplexity API key from .env.local)
   - Environment: Select all (Production, Preview, Development)
   - Click "Save"

4. **Verify Other Required Keys**
   Make sure these are also set:
   - `STORYBLOK_MANAGEMENT_TOKEN` - For Storyblok content management
   - `STORYBLOK_SPACE_ID` - Your Storyblok space ID
   - `ELEVENLABS_API_KEY` - For podcast generation
   - `SUPABASE_SERVICE_ROLE_KEY` - For Supabase service operations
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public anon key

5. **Redeploy**
   - After adding environment variables, you need to redeploy
   - Go to "Deployments" tab
   - Click on the three dots menu on the latest deployment
   - Select "Redeploy"
   - Or push a new commit to trigger automatic deployment

## Testing the Fix

After redeploying with the environment variables:

1. **Test AI Content Generation**
   - Go to `/admin/content`
   - Try generating a new artist profile or blog post
   - Should work without "Unauthorized" errors

2. **Test Mixcloud Import**
   - Go to `/admin/mixcloud`
   - Try importing shows
   - Should work with proper authentication

3. **Check Console for Errors**
   - Open browser developer tools (F12)
   - Check Console tab for any remaining errors

## Common Issues

### Issue: Still getting "Unauthorized" after adding key
- **Solution**: Make sure you redeployed after adding the environment variable
- **Check**: Verify the key is correct and has no extra spaces

### Issue: "Cannot find module" errors
- **Solution**: These are build errors - make sure all dependencies are installed
- **Check**: Run `npm install` locally and push changes

### Issue: Admin pages return 404
- **Solution**: This usually means build failed
- **Check**: Look at build logs in Vercel for specific errors

## Local Development

For local development, make sure your `.env.local` file contains:

```env
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxx
```

Replace `pplx-xxxxxxxxxxxx` with your actual Perplexity API key.

## Support

If you continue to have issues after adding the environment variables:
1. Check the Vercel build logs for specific errors
2. Verify all required environment variables are set
3. Ensure your Perplexity API key is valid and has credits