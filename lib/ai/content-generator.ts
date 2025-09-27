import { promises as fs } from 'fs'
import path from 'path'
import { markdownToStoryblokRichtext } from '@storyblok/richtext/markdown-parser'

// Content types
export type ContentType = 'artist-profile' | 'deep-dive' | 'blog-post' | 'show-description'

// Content generation request
export interface ContentRequest {
  type: ContentType
  topic: string
  additionalContext?: string
  targetLength?: 'short' | 'medium' | 'long'
}

// Generated content structure for Storyblok
export interface GeneratedContent {
  title: string
  seoTitle: string
  subtitle?: string
  metaDescription: string
  richTextContent: any // Storyblok rich text format
  tags: string[]
  category: string
  metadata: {
    generatedAt: string
    contentType: ContentType
    wordCount: number
  }
  // SEO nestable block data
  seoBlock?: {
    component: 'seo'
    title: string
    description: string
    og_title: string
    og_description: string
    og_image?: any
    twitter_title: string
    twitter_description: string
    twitter_image?: any
  }
  // Source metadata from Perplexity API search_results field
  searchResults?: Array<{
    title: string
    url: string
    date?: string
  }>
}

// Prompt templates for different content types
const PROMPT_TEMPLATES = {
  'artist-profile': {
    system: `You are a music journalist and cultural critic specializing in artist profiles. Your writing style is engaging, informative, and captures both the artistic and personal journey of musicians. You focus on:

- Musical evolution and influences
- Cultural impact and significance
- Personal background and artistic development
- Current projects and future directions
- Critical analysis of their work

Use your knowledge to provide comprehensive information about the artist, including their career highlights, musical style, and cultural impact.`,

    user: (topic: string, context?: string) => `
Create a comprehensive artist profile for: ${topic}

${context ? `Additional context: ${context}` : ''}

Structure the content as:
1. Opening hook that captures their essence
2. Background and early influences
3. Musical evolution and key works
4. Cultural impact and significance
5. Current projects and future outlook

REQUIREMENTS:
- Use web search to gather the most current information about the artist
- Include recent releases, tours, collaborations, and news (2024-2025)
- Verify biographical details and career milestones
- Focus on factual accuracy and current relevance
- Write comprehensive, well-researched content without embedded citations

Write in an engaging, journalistic style suitable for music enthusiasts.`
  },

  'deep-dive': {
    system: `You are a music historian and cultural analyst creating in-depth explorations of musical topics. Your deep dives are:

- Thoroughly researched and factually accurate
- Analytically rigorous yet accessible
- Rich in historical context and cultural significance
- Supported by current information and sources
- Structured for both casual readers and music scholars

Use your extensive knowledge to provide thorough analysis, incorporating historical context and multiple perspectives on the topic.`,

    user: (topic: string, context?: string) => `
Create a comprehensive deep dive exploration of: ${topic}

${context ? `Additional context: ${context}` : ''}

Structure as:
1. Introduction that establishes significance
2. Historical background and context
3. Key developments and turning points
4. Cultural and artistic impact
5. Current relevance and future implications
6. Conclusion with broader insights

REQUIREMENTS:
- Research thoroughly using web search for current information and recent developments
- Include specific examples, dates, and cultural references
- Verify historical facts and recent developments (2024-2025)
- Balance scholarly depth with accessibility
- Write comprehensive, well-researched content without embedded citations

Write for both music enthusiasts and general audiences.`
  },

  'blog-post': {
    system: `You are a contemporary music blogger with a keen eye for trends, culture, and the intersection of music with society. Your blog posts are:

- Timely and relevant to current music culture
- Personal yet informative in tone
- Engaging and shareable
- Well-researched with current information
- Accessible to a broad audience

Draw from your knowledge of current trends, cultural movements, and music industry developments.`,

    user: (topic: string, context?: string) => `
Write an engaging blog post about: ${topic}

${context ? `Additional context: ${context}` : ''}

Structure as:
1. Compelling headline and opening
2. Context and why this matters now
3. Analysis and insights
4. Examples and current references
5. Personal perspective or opinion
6. Call to action or discussion prompt

REQUIREMENTS:
- Use web search to find the latest trends, news, and developments (2024-2025)
- Include current social media buzz, streaming numbers, or recent events
- Reference recent releases, chart positions, or industry news
- Keep tone conversational but well-informed
- Write comprehensive, well-researched content without embedded citations

Write in a conversational yet informed tone suitable for music blog readers.`
  },

  'show-description': {
    system: `You are a music journalist and radio programmer writing in the style of NPR Music. Your show descriptions should embody:

- Professional, journalistic tone with cultural depth
- Thoughtful analysis of musical selections and flow
- Contextual storytelling that elevates the listening experience
- Sophisticated language that respects both music and audience
- NPR's signature blend of accessibility and intelligence

Write descriptions that inform, inspire, and invite deeper musical exploration, treating each show as a curated cultural experience worthy of thoughtful consideration.`,

    user: (topic: string, context?: string) => `
Craft a professional show description in the style of NPR Music for: ${topic}

Tracklist information: ${context}

CRITICAL REQUIREMENTS:
- Exactly 500-600 characters (including spaces)
- NPR Music editorial style: intelligent, journalistic, culturally aware
- Focus on musical narrative and artistic context
- Highlight key artists and their significance
- Treat the show as curated cultural programming

RESEARCH REQUIREMENTS:
- Use web search to gather current context about featured artists
- Look up recent releases, cultural significance, and career highlights
- Research any musical movements or trends represented
- Find connections between artists that inform the curatorial narrative
- Verify current spelling of artist names and track titles

Structure your description to include:
1. Contextual opening that frames the musical journey
2. Key artists presented with cultural/artistic significance (informed by research)
3. Musical themes, genres, or curatorial thread
4. What makes this selection meaningful for contemporary listeners

Writing Guidelines:
- Use sophisticated, journalistic language informed by research
- Provide cultural context discovered through web search
- Reference recent developments in artists' careers when relevant
- Describe musical connections and flow thoughtfully
- Write for culturally curious, music-loving audience
- Stay within 500-600 character limit (strictly enforced)
- Avoid promotional language, focus on editorial insight
- Reference musical movements, influences, or innovations found in research

Create a description that positions this show as thoughtful cultural programming, worthy of the NPR Music brand, enhanced by current knowledge of the featured artists.`
  }
}

// Load custom prompts from file system
async function loadCustomPrompts() {
  try {
    const promptsPath = path.join(process.cwd(), 'data', 'custom-prompts.json')
    const data = await fs.readFile(promptsPath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null // Fall back to default prompts
  }
}

// Generate comprehensive SEO data using Perplexity AI
async function generateEnhancedSEOData(content: string, originalTitle: string, type: ContentType): Promise<{
  seoTitle: string
  metaDescription: string
  seoBlock: GeneratedContent['seoBlock']
}> {
  try {
    // Use Perplexity to generate optimized SEO content
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "sonar", // Use faster model for SEO generation
        messages: [
          {
            role: "system",
            content: `You are an SEO expert. Generate optimized SEO metadata for web content.

            Requirements:
            - Title tags: 50-60 characters, include primary keyword
            - Meta descriptions: 150-160 characters, compelling call-to-action
            - Open Graph: Optimized for social sharing
            - Twitter Cards: Optimized for Twitter engagement
            - Use natural language, avoid keyword stuffing
            - Make each variant slightly different but consistent`
          },
          {
            role: "user",
            content: `Generate SEO metadata for this ${type} content:

            Title: ${originalTitle}
            Content excerpt: ${content.substring(0, 500)}...

            Return a JSON object with these exact fields:
            {
              "title": "SEO optimized title tag",
              "description": "Meta description",
              "og_title": "Open Graph title",
              "og_description": "Open Graph description",
              "twitter_title": "Twitter card title",
              "twitter_description": "Twitter description"
            }`
          }
        ],
        temperature: 0.3, // Lower temperature for consistent SEO
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`SEO generation failed: ${response.statusText}`)
    }

    const completion = await response.json()
    const seoText = completion.choices[0]?.message?.content || ""

    // Try to parse JSON response
    let seoData
    try {
      // Extract JSON from the response (in case it's wrapped in text)
      const jsonMatch = seoText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        seoData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.warn('Failed to parse SEO JSON, using fallback:', parseError)
      // Fallback to simple generation
      return generateSimpleSEOFallback(content, originalTitle)
    }

    return {
      seoTitle: seoData.title || originalTitle,
      metaDescription: seoData.description || content.substring(0, 160),
      seoBlock: {
        component: 'seo',
        title: seoData.title || originalTitle,
        description: seoData.description || content.substring(0, 160),
        og_title: seoData.og_title || seoData.title || originalTitle,
        og_description: seoData.og_description || seoData.description || content.substring(0, 160),
        twitter_title: seoData.twitter_title || seoData.title || originalTitle,
        twitter_description: seoData.twitter_description || seoData.description || content.substring(0, 160),
      }
    }
  } catch (error) {
    console.error('Enhanced SEO generation failed, using fallback:', error)
    return generateSimpleSEOFallback(content, originalTitle)
  }
}

// Fallback for simple SEO generation without AI
function generateSimpleSEOFallback(content: string, originalTitle: string): {
  seoTitle: string
  metaDescription: string
  seoBlock: GeneratedContent['seoBlock']
} {
  const seoTitle = originalTitle.length > 60 ? originalTitle.substring(0, 57) + '...' : originalTitle
  const metaDescription = content.length > 160 ? content.substring(0, 157) + '...' : content

  return {
    seoTitle,
    metaDescription,
    seoBlock: {
      component: 'seo',
      title: seoTitle,
      description: metaDescription,
      og_title: seoTitle,
      og_description: metaDescription,
      twitter_title: seoTitle,
      twitter_description: metaDescription,
    }
  }
}

// Generate content using Perplexity only
export async function generateContent(request: ContentRequest): Promise<GeneratedContent> {
  // Try to load custom prompts, fall back to defaults
  const customPrompts = await loadCustomPrompts()
  let systemPrompt: string
  let userPrompt: string

  if (customPrompts && customPrompts[request.type]) {
    // Use custom prompts with variable substitution
    systemPrompt = customPrompts[request.type].system
    userPrompt = customPrompts[request.type].prompt
      .replace('${topic}', request.topic)
      .replace('${additionalContext}', request.additionalContext || '')
      .replace('${targetLength}', request.targetLength)
  } else {
    // Fall back to default templates
    console.log(`[AI Generation] Looking for template: ${request.type}`)
    console.log(`[AI Generation] Available templates: ${Object.keys(PROMPT_TEMPLATES).join(', ')}`)
    const template = PROMPT_TEMPLATES[request.type]
    console.log(`[AI Generation] Template found: ${template ? 'yes' : 'no'}`)
    if (!template) {
      throw new Error(`No template found for content type: ${request.type}`)
    }
    systemPrompt = template.system
    userPrompt = template.user(request.topic, request.additionalContext)
  }

  // Use Perplexity API directly for real-time web search
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "sonar", // Perplexity's standard model
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      return_citations: true, // Request citation metadata if available
      return_related_questions: false, // We don't need related questions
    }),
  })

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`)
  }

  const completion = await response.json()

  // Debug the exact response structure
  console.log(`[AI Generation] Full Perplexity Response:`, JSON.stringify(completion, null, 2))

  const text = completion.choices?.[0]?.message?.content || completion.content || ""

  if (!text) {
    console.log(`[AI Generation] ERROR: No content found in any expected location!`)
    console.log(`[AI Generation] Available keys:`, Object.keys(completion))
    if (completion.choices?.[0]) {
      console.log(`[AI Generation] Choice[0] keys:`, Object.keys(completion.choices[0]))
      if (completion.choices[0].message) {
        console.log(`[AI Generation] Message keys:`, Object.keys(completion.choices[0].message))
      }
    }
    throw new Error('No content received from Perplexity API - check response structure')
  }

  // Extract source metadata from Perplexity's search_results field
  const searchResults = completion.search_results || []

  // Parse SEO metadata first
  const parsedSEO = extractSEOMetadata(text)
  const cleanedText = cleanSEOMetadataFromContent(text)

  // Convert cleaned markdown from Perplexity to Storyblok rich text format
  const richTextContent = markdownToStoryblokRichtext(cleanedText)

  // Extract title and metadata from parsed SEO or fallback to content extraction
  const title = parsedSEO.title || extractTitle(cleanedText) || generateTitle(request.topic, request.type)
  const metaDescription = parsedSEO.metaDescription

  // Generate tags based on content
  const tags = generateTags(cleanedText, request.type)

  // Generate enhanced SEO data with nestable block structure (only if not already provided)
  const seoData = metaDescription
    ? { seoTitle: title, metaDescription, seoBlock: createSEOBlock(title, metaDescription) }
    : await generateEnhancedSEOData(text, title, request.type)

  return {
    title,
    seoTitle: seoData.seoTitle,
    subtitle: extractSubtitle(text),
    metaDescription: seoData.metaDescription,
    richTextContent,
    tags,
    category: getCategoryForType(request.type),
    metadata: {
      generatedAt: new Date().toISOString(),
      contentType: request.type,
      wordCount: cleanedText.split(' ').length
    },
    seoBlock: seoData.seoBlock,
    // Include source metadata from Perplexity's search_results field
    searchResults: searchResults
  }
}

// Note: We now use @storyblok/richtext's markdownToRichtext function
// which properly handles all markdown formatting including:
// - Bold, italic, strikethrough, links, lists, code blocks, quotes, images
// - Citations from Perplexity as clickable links

// Helper functions
function extractTitle(text: string): string | null {
  const lines = text.split('\n')
  // Find the first heading that is NOT "Sources" or "References"
  const titleLine = lines.find(line => {
    if (!line.startsWith('#')) return false
    const headingText = line.replace(/^#+\s*/, '').toLowerCase()
    return !headingText.includes('source') && !headingText.includes('reference')
  })
  return titleLine?.replace(/^#+\s*/, '') || null
}

function extractSubtitle(text: string): string | undefined {
  const lines = text.split('\n')
  // Find the first heading that is NOT "Sources" or "References"
  const titleIndex = lines.findIndex(line => {
    if (!line.startsWith('#')) return false
    const headingText = line.replace(/^#+\s*/, '').toLowerCase()
    return !headingText.includes('source') && !headingText.includes('reference')
  })
  if (titleIndex >= 0 && titleIndex < lines.length - 1) {
    const nextLine = lines[titleIndex + 1]
    if (nextLine && !nextLine.startsWith('#')) {
      return nextLine.trim()
    }
  }
  return undefined
}

function generateTitle(topic: string, type: ContentType): string {
  const typeLabels = {
    'artist-profile': 'Artist Profile',
    'deep-dive': 'Deep Dive',
    'blog-post': 'Blog Post',
    'show-description': 'Show Description'
  }
  return `${typeLabels[type]}: ${topic}`
}

function generateTags(text: string, type: ContentType): string[] {
  const baseTags = {
    'artist-profile': ['artist', 'profile', 'music'],
    'deep-dive': ['analysis', 'deep-dive', 'music-history'],
    'blog-post': ['blog', 'music', 'culture'],
    'show-description': ['radio-show', 'mixcloud', 'music-discovery']
  }

  // Add content-specific tags (could be enhanced with AI analysis)
  const contentTags = []
  if (text.toLowerCase().includes('jazz')) contentTags.push('jazz')
  if (text.toLowerCase().includes('rock')) contentTags.push('rock')
  if (text.toLowerCase().includes('hip-hop')) contentTags.push('hip-hop')
  if (text.toLowerCase().includes('electronic')) contentTags.push('electronic')

  return [...baseTags[type], ...contentTags]
}

function getCategoryForType(type: ContentType): string {
  const categories = {
    'artist-profile': 'Artist Profiles',
    'deep-dive': 'Deep Dives',
    'blog-post': 'Blog Posts',
    'show-description': 'Show Descriptions'
  }
  return categories[type]
}

// Generate podcast script from deep dive content optimized for ElevenLabs v3
export async function generatePodcastScript(deepDiveContent: string): Promise<string> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "sonar-pro", // Using Perplexity pro for script generation too
      messages: [
        {
          role: "system",
          content: `You are a podcast script writer who creates engaging audio content optimized for ElevenLabs v3 text-to-speech.

CRITICAL REQUIREMENTS FOR ELEVENLABS V3:
- Use audio tags for natural speech: [whispers], [excited], [thoughtful], [emphasizes], [chuckles], [serious]
- Script must be 250+ characters for optimal v3 performance
- Include emotional cues and conversational markers
- Use natural punctuation for rhythm and pauses
- Add capitalization sparingly for emphasis
- Structure with clear verbal transitions

STYLE GUIDELINES:
- Write like a knowledgeable music host speaking to friends
- Include natural conversational fillers and reactions
- Add emotional responses to interesting facts
- Use rhetorical questions to engage listeners
- Maintain authenticity and enthusiasm for the subject`
        },
        {
          role: "user",
          content: `Transform this deep dive article into an engaging podcast script optimized for ElevenLabs v3:

${deepDiveContent}

Create a compelling script with:
- [enthusiastic] engaging hook/intro
- Natural speech patterns with audio tags
- Conversational transitions between topics
- Emotional reactions: [surprised], [impressed], [thoughtful]
- Compelling conclusion with [warm] call-to-action

Use ElevenLabs v3 audio formatting throughout. Minimum 250 characters required.`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    }),
  })

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`)
  }

  const completion = await response.json()
  return completion.choices[0]?.message?.content || ""
}

// Extract SEO metadata from AI response (for deep-dive content)
function extractSEOMetadata(text: string): { title?: string; metaDescription?: string } {
  const seoTitleMatch = text.match(/SEO_TITLE:\s*(.+)/i)
  const metaDescMatch = text.match(/META_DESCRIPTION:\s*(.+)/i)

  return {
    title: seoTitleMatch?.[1]?.trim(),
    metaDescription: metaDescMatch?.[1]?.trim()
  }
}

// Remove SEO metadata lines from content
function cleanSEOMetadataFromContent(text: string): string {
  return text
    .replace(/SEO_TITLE:\s*.+/i, '')
    .replace(/META_DESCRIPTION:\s*.+/i, '')
    .replace(/^\s*\n+/g, '') // Remove leading empty lines
    .trim()
}

// Create SEO block structure
function createSEOBlock(title: string, description: string): GeneratedContent['seoBlock'] {
  return {
    component: 'seo',
    title,
    description,
    og_title: title,
    og_description: description,
    twitter_title: title,
    twitter_description: description
  }
}