import OpenAI from 'openai'
import { z } from 'zod'
import { promises as fs } from 'fs'
import path from 'path'

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

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

Use web search to gather current information and ensure accuracy. Write in an engaging, journalistic style suitable for music enthusiasts.`
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

Research thoroughly using web search. Include specific examples, dates, and cultural references. Write for both music enthusiasts and general audiences.`
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

Use web search to include current trends and recent developments. Write in a conversational yet informed tone suitable for music blog readers.`
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

// Generate SEO-optimized title and meta description
async function generateSEOData(content: string, originalTitle: string, contentType: ContentType, topic: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an SEO expert who creates search-optimized titles and meta descriptions for music content.

SEO REQUIREMENTS:
- SEO Title: 50-60 characters, includes primary keyword, compelling and clickable
- Meta Description: 150-160 characters, includes primary keyword, action-oriented, enticing

CONTENT TYPE GUIDELINES:
- Artist Profile: Focus on artist name, genre, key achievements
- Deep Dive: Emphasize analytical/educational angle, musical significance
- Blog Post: Highlight trending topics, current relevance, engagement

Create titles and descriptions that will rank well and get clicks in music-related searches.`
        },
        {
          role: "user",
          content: `Based on this ${contentType} content about "${topic}", create SEO-optimized title and meta description:

Original Title: ${originalTitle}

Content Summary: ${content.substring(0, 500)}...

Generate:
1. SEO Title (50-60 chars): Optimized for search visibility and clicks
2. Meta Description (150-160 chars): Compelling summary that encourages clicks

Format as:
SEO_TITLE: [title here]
META_DESCRIPTION: [description here]`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    const text = completion.choices[0]?.message?.content || ""

    // Parse the response
    const lines = text.split('\n')
    const seoTitle = lines.find(line => line.startsWith('SEO_TITLE:'))?.replace('SEO_TITLE:', '').trim() || originalTitle
    const metaDescription = lines.find(line => line.startsWith('META_DESCRIPTION:'))?.replace('META_DESCRIPTION:', '').trim() ||
      content.substring(0, 155).trim() + '...'

    return {
      seoTitle: seoTitle.length > 60 ? seoTitle.substring(0, 57) + '...' : seoTitle,
      metaDescription: metaDescription.length > 160 ? metaDescription.substring(0, 157) + '...' : metaDescription
    }
  } catch (error) {
    console.error('SEO generation error:', error)
    // Fallback to simple SEO data
    return {
      seoTitle: originalTitle.length > 60 ? originalTitle.substring(0, 57) + '...' : originalTitle,
      metaDescription: content.substring(0, 155).trim() + '...'
    }
  }
}

// Generate content using GPT-5 with web search
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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o", // Using GPT-4o for now, can switch to GPT-5 when available
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
    max_tokens: 4000
  })

  const text = completion.choices[0]?.message?.content || ""

  // Convert generated text to Storyblok rich text format
  const richTextContent = convertToStoryblokRichText(text)

  // Extract title from content or generate one
  const title = extractTitle(text) || generateTitle(request.topic, request.type)

  // Generate tags based on content
  const tags = generateTags(text, request.type)

  // Generate SEO-optimized title and meta description
  const seoData = await generateSEOData(text, title, request.type, request.topic)

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

// Convert plain text to Storyblok rich text format
function convertToStoryblokRichText(text: string) {
  const paragraphs = text.split('\n\n').filter(p => p.trim())

  return {
    type: 'doc',
    content: paragraphs.map(paragraph => {
      // Check if it's a heading
      if (paragraph.startsWith('#')) {
        const level = paragraph.match(/^#+/)?.[0].length || 1
        return {
          type: 'heading',
          attrs: { level: Math.min(level, 6) },
          content: [
            {
              type: 'text',
              text: paragraph.replace(/^#+\s*/, '')
            }
          ]
        }
      }

      // Regular paragraph
      return {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: paragraph
          }
        ]
      }
    })
  }
}

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
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
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
  })

  return completion.choices[0]?.message?.content || ""
}