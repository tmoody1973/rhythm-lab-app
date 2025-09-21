import { promises as fs } from 'fs'
import path from 'path'
import { markdownToStoryblokRichtext } from '@storyblok/richtext/markdown-parser'

// Content types
export type ContentType = 'artist-profile' | 'deep-dive' | 'blog-post'

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
- Add citations at the end in format: "Sources: [1] Website Name - Article Title, [2] Website Name - Article Title"
- Focus on factual accuracy and current relevance

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
- Add citations at the end in format: "Sources: [1] Website Name - Article Title, [2] Website Name - Article Title"
- Balance scholarly depth with accessibility

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
- Add citations at the end in format: "Sources: [1] Website Name - Article Title, [2] Website Name - Article Title"
- Keep tone conversational but well-informed

Write in a conversational yet informed tone suitable for music blog readers.`
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

// Generate simple SEO-optimized title and meta description
async function generateSimpleSEOData(content: string, originalTitle: string) {
  // Simple SEO optimization without OpenAI
  const seoTitle = originalTitle.length > 60 ? originalTitle.substring(0, 57) + '...' : originalTitle
  const metaDescription = content.length > 160 ? content.substring(0, 157) + '...' : content

  return {
    seoTitle,
    metaDescription
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
    const template = PROMPT_TEMPLATES[request.type]
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
      model: "sonar-pro", // Perplexity's pro model with enhanced web search
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
    }),
  })

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`)
  }

  const completion = await response.json()
  const text = completion.choices[0]?.message?.content || ""

  // Convert markdown from Perplexity to Storyblok rich text format
  const richTextContent = markdownToStoryblokRichtext(text)

  // Extract title from content or generate one
  const title = extractTitle(text) || generateTitle(request.topic, request.type)

  // Generate tags based on content
  const tags = generateTags(text, request.type)

  // Generate SEO-optimized title and meta description using simple approach
  const seoData = await generateSimpleSEOData(text, title)

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
      wordCount: text.split(' ').length
    }
  }
}

// Note: We now use @storyblok/richtext's markdownToRichtext function
// which properly handles all markdown formatting including:
// - Bold, italic, strikethrough, links, lists, code blocks, quotes, images
// - Citations from Perplexity as clickable links

// Helper functions
function extractTitle(text: string): string | null {
  const lines = text.split('\n')
  const titleLine = lines.find(line => line.startsWith('#'))
  return titleLine?.replace(/^#+\s*/, '') || null
}

function extractSubtitle(text: string): string | undefined {
  const lines = text.split('\n')
  const titleIndex = lines.findIndex(line => line.startsWith('#'))
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
    'blog-post': 'Blog Post'
  }
  return `${typeLabels[type]}: ${topic}`
}

function generateTags(text: string, type: ContentType): string[] {
  const baseTags = {
    'artist-profile': ['artist', 'profile', 'music'],
    'deep-dive': ['analysis', 'deep-dive', 'music-history'],
    'blog-post': ['blog', 'music', 'culture']
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
    'blog-post': 'Blog Posts'
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