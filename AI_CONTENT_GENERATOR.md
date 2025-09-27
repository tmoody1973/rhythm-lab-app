# AI Content Generator Setup & Configuration

## Overview

The AI Content Generator creates high-quality content for artist profiles, deep dives, and blog posts using OpenAI GPT-5, with web search integration and ElevenLabs v3 podcast generation capabilities. Content is published directly to Storyblok CMS.

## Features

✅ **Content Generation**
- Artist profiles with web search for current information
- Deep dive articles with thinking mode analysis
- Blog posts with engaging narratives
- Rich text formatting for Storyblok compatibility
- **SEO-optimized titles and meta descriptions** for all content types

✅ **AI Integration**
- Perplexity API with reasoning/thinking mode
- Web search tool for current information
- Advanced prompt engineering templates
- Content optimization for each type

✅ **Storyblok Publishing**
- Direct publishing to Storyblok CMS
- Rich text block formatting
- Draft creation with metadata
- Content categorization and tagging
- **SEO metadata** automatically applied (title tags, meta descriptions, Open Graph, Twitter Cards)

✅ **Podcast Generation (Phase 2)**
- ElevenLabs v3 API integration
- Deep dive to podcast script conversion
- Audio generation with voice options
- Automatic sync to Storyblok deep dive stories

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# OpenAI GPT-5 Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Storyblok Configuration
STORYBLOK_MANAGEMENT_TOKEN=your-storyblok-management-token
STORYBLOK_SPACE_ID=123456

# Storyblok Folder IDs (for content organization)
STORYBLOK_PROFILES_FOLDER_ID=1001    # Artist profiles folder
STORYBLOK_DEEP_DIVES_FOLDER_ID=1002  # Deep dives folder
STORYBLOK_BLOG_FOLDER_ID=1003        # Blog posts folder

# ElevenLabs Configuration (for podcast generation)
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
```

## API Keys Setup

### 1. OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Create a new API key with GPT-5 access
3. Add to `OPENAI_API_KEY` environment variable

### 2. Storyblok Management Token & Folder IDs
1. Go to your Storyblok space settings
2. Navigate to "Access Tokens"
3. Create a new "Management API Token"
4. Add to `STORYBLOK_MANAGEMENT_TOKEN` environment variable
5. Find your Space ID in the URL when editing content
6. Add to `STORYBLOK_SPACE_ID` environment variable

**Finding Folder IDs:**
1. In Storyblok, navigate to your content folders
2. Click on each folder (profiles, deep-dives, blog)
3. Check the URL - the folder ID is the number after `/folders/`
   - Example: `/folders/1001` → Folder ID is `1001`
4. Add the respective folder IDs to:
   - `STORYBLOK_PROFILES_FOLDER_ID`
   - `STORYBLOK_DEEP_DIVES_FOLDER_ID`
   - `STORYBLOK_BLOG_FOLDER_ID`

### 3. ElevenLabs API Key
1. Visit https://elevenlabs.io/docs/quickstart
2. Sign up and get your API key from account settings
3. Add to `ELEVENLABS_API_KEY` environment variable

## Usage Guide

### Accessing the Content Generator

1. Navigate to `/admin/content` in your application
2. Ensure you have admin authentication configured

### Prompt Management (Admin Only)

1. Navigate to `/admin/prompts` to customize AI prompts
2. Edit system prompts and user prompt templates
3. Changes are applied immediately to new content generation
4. Prompts are server-side only and protected from public access

### Content Generation Process

1. **Select Content Type**: Choose from Artist Profile, Deep Dive, or Blog Post
2. **Enter Topic**: Provide the subject (e.g., "Miles Davis", "Jazz Fusion Evolution")
3. **Add Context** (Optional): Include specific focus or additional information
4. **Choose Length**: Select target word count (500, 1000, or 2000 words)
5. **Generate**: Click "Generate Content" to create AI content
6. **Review**: Preview the generated content with metadata
7. **Publish**: Send to Storyblok as a draft for editing and media addition

### Podcast Generation (Deep Dives Only)

1. Generate a deep dive article first
2. Click "Generate Podcast" button
3. Audio is generated using ElevenLabs v3 with optimized script
4. If published to Storyblok, audio file is automatically attached
5. Otherwise, audio downloads as MP3 file

## Content Types & Prompts

### Artist Profile
- **Focus**: Biographical information, career highlights, musical style
- **Web Search**: Latest news, recent releases, current activities
- **Length**: 500-1500 words
- **Storyblok Component**: `artist_profile`

### Deep Dive
- **Focus**: In-depth analysis, historical context, cultural impact
- **Thinking Mode**: Complex reasoning for nuanced insights
- **Length**: 1000-2500 words
- **Storyblok Component**: `deep_dive`
- **Podcast Ready**: Optimized for ElevenLabs v3 conversion

### Blog Post
- **Focus**: Engaging narratives, current topics, opinion pieces
- **Web Search**: Current events, trending topics, recent developments
- **Length**: 500-1200 words
- **Storyblok Component**: `blog_post`

## ElevenLabs v3 Optimization

The podcast generation uses ElevenLabs v3 best practices:

### Audio Tags
Scripts include emotional cues:
- `[enthusiastic]` - Excited delivery
- `[thoughtful]` - Contemplative tone
- `[emphasizes]` - Strong emphasis
- `[chuckles]` - Natural laughter
- `[whispers]` - Quiet, intimate tone

### Voice Settings
- **Stability**: 0.5 (Natural balance)
- **Similarity Boost**: 0.75 (High clarity for podcasts)
- **Speaker Boost**: Enabled for better audio quality
- **Model**: `eleven_v3` (Latest model)

### Available Voices
- `professional_male` - Professional podcast host
- `professional_female` - Professional female voice
- `conversational` - Casual, friendly tone

## Storyblok Integration

### Content Structure
Generated content creates Storyblok stories with:
- **Title & Subtitle**: SEO-optimized headings
- **Rich Text Content**: Properly formatted for Storyblok editor
- **Tags**: Automatic categorization
- **Category**: Content type classification
- **Meta Data**: SEO fields (title, description, Open Graph)
- **Audio File**: (Deep dives only) Attached podcast audio

### Workflow
1. Content generated as draft in Storyblok
2. Edit and enhance in Storyblok editor
3. Add images, videos, and media
4. Publish when ready

## Troubleshooting

### Common Issues

**Content Generation Fails**
- Check `OPENAI_API_KEY` is valid and has GPT-5 access
- Verify internet connection for web search tool
- Ensure topic is appropriate and not too vague

**Storyblok Publishing Fails**
- Verify `STORYBLOK_MANAGEMENT_TOKEN` has write permissions
- Check `STORYBLOK_SPACE_ID` is correct
- Ensure Storyblok space has required content types configured

**Podcast Generation Fails**
- Verify `ELEVENLABS_API_KEY` is valid
- Check ElevenLabs account has sufficient credits
- Ensure content is suitable for audio conversion (not too short)

### Content Type Setup in Storyblok

Ensure these content types exist in your Storyblok space:
- `artist_profile`
- `deep_dive`
- `blog_post`

Each should have fields for:
- `title` (Text)
- `subtitle` (Text)
- `content` (Richtext)
- `tags` (Text, multiple)
- `category` (Text)
- `audio_file` (Asset - for deep dives)

## Performance Notes

- Content generation typically takes 30-60 seconds
- Podcast generation can take 2-5 minutes depending on length
- Web search adds 5-10 seconds to generation time
- Storyblok publishing is usually immediate

## Prompt Management System

### Easy Prompt Customization

The system includes a secure prompt management interface accessible at `/admin/prompts`:

**Features:**
- **Visual Editor**: Edit prompts with syntax highlighting
- **Live Preview**: See changes immediately
- **Variable Templates**: Use `${topic}`, `${additionalContext}`, `${targetLength}`
- **Backup & Restore**: Reset to defaults anytime
- **Server-Side Storage**: Prompts stored in `/data/custom-prompts.json`

**Security:**
- Admin-only access (behind authentication)
- Server-side file storage
- No public API exposure
- Prompts never sent to client

**Customization Process:**
1. Navigate to `/admin/prompts`
2. Edit system prompts (AI role & behavior)
3. Modify user prompt templates (content structure)
4. Save changes (applied immediately)
5. Test with new content generation

**Variable Substitution:**
```
${topic} - The subject entered by user
${additionalContext} - Optional context/focus
${targetLength} - short/medium/long
```

### Prompt Templates Structure

Each content type has three components:

1. **System Prompt**: Defines AI role and expertise
2. **User Prompt Template**: Content structure and requirements
3. **Usage Notes**: Guidelines for this content type

## Security Considerations

- API keys are server-side only (Next.js API routes)
- No client-side exposure of sensitive credentials
- Prompts are protected and admin-only
- Content is created as drafts by default
- Manual review and publishing required in Storyblok