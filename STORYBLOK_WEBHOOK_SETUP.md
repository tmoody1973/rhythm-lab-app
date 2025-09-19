# Storyblok Webhook Setup for Cache Revalidation

This document explains how to set up Storyblok webhooks to automatically clear Vercel's cache when content is updated.

## Problem
When you update content in Storyblok, the changes don't appear immediately on your website because:
1. Vercel caches your pages and API responses
2. Storyblok CDN caches published content
3. Browser caches responses

## Solution
Set up a webhook that triggers Vercel cache revalidation whenever content changes in Storyblok.

## Setup Instructions

### 1. Add Environment Variable (Optional Security)
In your Vercel dashboard or `.env.local`:
```bash
STORYBLOK_WEBHOOK_SECRET=your-secret-token-here
```

### 2. Configure Webhook in Storyblok

1. Go to your Storyblok space settings
2. Navigate to **Webhooks** section
3. Click **New Webhook**
4. Configure as follows:

**Webhook Configuration:**
- **Name**: `Vercel Cache Revalidation`
- **Endpoint URL**: `https://your-domain.vercel.app/api/revalidate`
  - Replace `your-domain` with your actual Vercel domain
  - For testing: `http://localhost:3000/api/revalidate`
- **Secret** (optional): Your `STORYBLOK_WEBHOOK_SECRET` value
- **Triggers**: Select the events that should trigger revalidation:
  - ✅ `story.published` - When content is published
  - ✅ `story.unpublished` - When content is unpublished
  - ✅ `story.deleted` - When content is deleted
  - ✅ `story.moved` - When content is moved/restructured
  - ❌ `story.created` - Usually not needed (drafts don't affect live site)
  - ❌ `story.updated` - Only needed if you want to clear cache on every save

### 3. Test the Webhook

#### Option A: Use Storyblok's Test Feature
1. In your webhook settings, click **Test**
2. Check your Vercel function logs to see if it received the webhook

#### Option B: Manual Testing
```bash
# Test the endpoint directly
curl -X POST https://your-domain.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token" \
  -d '{"story": {"slug": "test-post", "full_slug": "blog/test-post", "id": 12345}}'
```

#### Option C: Test in Development
```bash
# Test locally
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"story": {"slug": "test-post", "full_slug": "blog/test-post", "id": 12345}}'
```

### 4. Verify Setup

1. **Update a blog post** in Storyblok
2. **Publish the changes**
3. **Check your website** - changes should appear within seconds
4. **Check Vercel function logs** to confirm webhook was received

## How It Works

1. **You edit content** in Storyblok
2. **You publish** the content
3. **Storyblok sends webhook** to your API endpoint
4. **Your API calls `revalidatePath()`** to clear Vercel's cache
5. **Next visitor gets fresh content** from Storyblok

## Supported Content Types

The webhook automatically handles:
- **Blog posts**: `/blog/[slug]` and `/blog`
- **Deep dives**: `/deep-dives/[slug]` and `/deep-dives`
- **Profiles**: `/profiles/[slug]` and `/profiles`
- **Home page**: `/` (always revalidated)

## Troubleshooting

### Webhook Not Triggering
- Check webhook URL is correct and accessible
- Verify secret token matches environment variable
- Check Storyblok webhook logs for errors

### Cache Not Clearing
- Check Vercel function logs for errors
- Verify `revalidatePath()` is being called
- Try manual revalidation via API

### Still Seeing Old Content
- Clear browser cache (Cmd+Shift+R / Ctrl+Shift+F5)
- Check if you're viewing draft vs published content
- Verify content was actually published in Storyblok

## Advanced Configuration

### Custom Cache Tags
You can add cache tags to your API calls for more granular control:

```typescript
// In your page component
const response = await storyblokApi.get(`cdn/stories/blog/${slug}`, {
  ...getStoryblokOptions(),
  next: {
    tags: ['storyblok', `story-${story.id}`, 'blog-posts']
  }
});
```

### Conditional Revalidation
Modify the webhook to only revalidate specific content types:

```typescript
// In /api/revalidate/route.ts
if (story.content_type === 'blog_post') {
  // Only revalidate for blog posts
  pathsToRevalidate.push(`/blog/${slug}`)
}
```

## Security Notes

- Use the secret token to verify webhooks are from Storyblok
- The endpoint is public but should only accept POST requests
- Consider rate limiting if you have high-frequency content updates

## Testing Checklist

- [ ] Webhook endpoint responds with 200 status
- [ ] Secret validation works (if enabled)
- [ ] Blog post changes appear immediately after publish
- [ ] Vercel function logs show successful revalidation
- [ ] Multiple content types work (blog, deep-dives, profiles)
- [ ] Home page updates when new content is published