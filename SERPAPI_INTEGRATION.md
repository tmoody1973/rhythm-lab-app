# SerpAPI Image Integration Guide

## Overview

This integration adds intelligent image search and selection to your AI content generation workflow using SerpAPI's Google Images search.

## Features

### 🔍 Smart Image Search
- **Real-time image discovery** using Google Images via SerpAPI
- **Context-aware search queries** generated based on content type and topic
- **Advanced filtering** by image type, size, and safety settings
- **High-quality results** with detailed metadata

### 🎨 User-Friendly Interface
- **Visual image selector** with thumbnail previews
- **Suggested search queries** tailored to content type
- **One-click image selection** and upload to Storyblok
- **Image metadata** including source, title, and licensing info

### 📁 Seamless Storyblok Integration
- **Automatic asset upload** to Storyblok media library
- **SEO block population** with selected images for OG and Twitter
- **Proper image optimization** with alt text and titles
- **Organized file naming** based on content type and topic

## How It Works

### 1. Content Generation Workflow

```
Generate Content → Select Images → Publish to Storyblok
     ↓                ↓               ↓
   AI creates      SerpAPI finds   Images added to
   content text    relevant        SEO block automatically
                   images
```

### 2. Image Search Process

1. **Generate Content First**
   - Create artist profile, blog post, or deep dive
   - AI analyzes content and suggests relevant search queries

2. **Search for Images**
   - Use suggested queries or enter custom search terms
   - SerpAPI searches Google Images with safety filters
   - Results show thumbnails with source information

3. **Select and Upload**
   - Click any image to upload it to Storyblok
   - Image is automatically optimized and renamed
   - SEO metadata is populated with image references

### 3. Content Types & Search Strategies

#### Artist Profiles
- **Primary searches**: `{artist} musician artist photo`
- **Secondary searches**: `{artist} band live performance`, `{artist} album cover`
- **Fallback searches**: `{artist} concert stage photo`

#### Deep Dives
- **Primary searches**: `{topic} music history`
- **Secondary searches**: `{topic} vintage photos`, `{topic} album covers`
- **Fallback searches**: `{topic} instruments equipment`

#### Blog Posts
- **Primary searches**: `{topic} music culture`
- **Secondary searches**: `{topic} artistic illustration`, `music {topic} concept`
- **Fallback searches**: `{topic} lifestyle music`

## Setup Instructions

### 1. Get SerpAPI Key
1. Sign up at [SerpAPI.com](https://serpapi.com)
2. Get your API key from the dashboard
3. Add credits to your account (pay-per-search model)

### 2. Environment Variables

Add to your `.env.local`:
```env
SERPAPI_API_KEY=your-serpapi-key-here
```

Add to Vercel environment variables:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `SERPAPI_API_KEY` with your key
3. Redeploy your application

### 3. Storyblok SEO Block Setup

Ensure your Storyblok content types have the SEO nestable block with these fields:
- `title` (Text)
- `description` (Textarea)
- `og_title` (Text)
- `og_description` (Textarea)
- `og_image` (Asset)
- `twitter_title` (Text)
- `twitter_description` (Text)
- `twitter_image` (Asset)

## Usage Guide

### 1. Generate Content
- Go to `/admin/content`
- Fill in topic and content type
- Click "Generate Content"

### 2. Select Images
- Click the "Images" tab (appears after content generation)
- Use suggested search queries or enter custom terms
- Browse image results with thumbnails
- Click "Download" icon to select and upload

### 3. Publish to Storyblok
- Return to "Preview" tab
- Click "Publish to Storyblok"
- Selected images are automatically included in SEO block

## API Endpoints

### `/api/admin/search-images`
**POST** - Search for images using SerpAPI
```json
{
  "query": "Miles Davis trumpet",
  "contentType": "artist-profile",
  "maxResults": 20
}
```

### `/api/admin/upload-image-to-storyblok`
**POST** - Download and upload image to Storyblok
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "title": "Miles Davis performing",
  "alt": "Miles Davis - Miles Davis performing",
  "contentType": "artist-profile"
}
```

## Benefits

### For Content Creators
- **No manual image searching** - AI suggests relevant images
- **Professional quality** - Access to millions of high-quality images
- **Time savings** - One-click selection and upload process
- **SEO optimization** - Images automatically added to meta tags

### For SEO
- **Rich social sharing** - OG and Twitter images for better engagement
- **Search visibility** - Relevant images improve content ranking
- **Consistent branding** - Professional images across all content
- **Mobile optimization** - Proper image sizing and formats

### For Workflow
- **Integrated process** - No switching between tools
- **Automatic metadata** - Proper alt text and titles generated
- **Asset management** - Images organized in Storyblok library
- **Version control** - All images tracked with content versions

## Technical Details

### Image Processing
- **Download optimization** - Images cached temporarily for upload
- **File naming** - `{content-type}-{title}-{timestamp}.{ext}`
- **Metadata preservation** - Source URL, title, and alt text maintained
- **Error handling** - Graceful fallbacks for failed downloads

### Search Optimization
- **Safety filters** - Safe search enabled by default
- **Quality filters** - Large, high-quality photos preferred
- **Relevance scoring** - Google's algorithms ensure relevant results
- **Rate limiting** - Respects SerpAPI usage limits

### Storyblok Integration
- **Asset folders** - Images can be organized by content type
- **Rich metadata** - Full SEO data populated automatically
- **Version tracking** - Images linked to specific content versions
- **CDN optimization** - Storyblok's CDN handles image delivery

## Troubleshooting

### Common Issues

**No search results**
- Check SerpAPI key is valid and has credits
- Try broader search terms
- Verify safe search settings

**Upload failures**
- Check Storyblok management token permissions
- Verify space ID is correct
- Ensure image URL is accessible

**SEO block not populated**
- Verify SEO block structure matches expected fields
- Check content type has SEO block attached
- Confirm image upload completed successfully

### Error Messages

- `"SerpAPI key not configured"` - Add SERPAPI_API_KEY to environment
- `"Failed to download image"` - Image URL may be blocked or invalid
- `"Storyblok upload failed"` - Check Storyblok credentials and permissions

## Cost Considerations

### SerpAPI Pricing
- **Pay-per-search** model (~$0.01-0.05 per search)
- **Free tier** available for testing
- **Bulk discounts** for high-volume usage

### Optimization Tips
- Use suggested queries to reduce manual searches
- Cache search results when possible
- Monitor usage in SerpAPI dashboard

## Future Enhancements

- **AI image selection** - Automatically choose best images
- **Bulk image processing** - Select multiple images at once
- **Image editing** - Basic cropping and filtering
- **License checking** - Verify usage rights automatically
- **Custom search filters** - Color, style, and content filters