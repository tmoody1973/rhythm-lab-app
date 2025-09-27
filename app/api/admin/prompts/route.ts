import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { PROMPT_TEMPLATES } from '@/lib/ai/prompt-templates'

const PROMPTS_FILE_PATH = path.join(process.cwd(), 'data', 'custom-prompts.json')

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Load custom prompts or return defaults
async function loadPrompts() {
  try {
    await ensureDataDirectory()
    const data = await fs.readFile(PROMPTS_FILE_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    // Return default templates if custom file doesn't exist
    return {
      'artist-profile': {
        system: PROMPT_TEMPLATES['artist-profile'].system,
        prompt: PROMPT_TEMPLATES['artist-profile'].prompt('${topic}', '${additionalContext}', '${targetLength}'),
        notes: PROMPT_TEMPLATES['artist-profile'].notes
      },
      'deep-dive': {
        system: PROMPT_TEMPLATES['deep-dive'].system,
        prompt: PROMPT_TEMPLATES['deep-dive'].prompt('${topic}', '${additionalContext}', '${targetLength}'),
        notes: PROMPT_TEMPLATES['deep-dive'].notes
      },
      'blog-post': {
        system: PROMPT_TEMPLATES['blog-post'].system,
        prompt: PROMPT_TEMPLATES['blog-post'].prompt('${topic}', '${additionalContext}', '${targetLength}'),
        notes: PROMPT_TEMPLATES['blog-post'].notes
      },
      'show-description': {
        system: `You are a radio show curator and music discovery expert who creates compelling show descriptions for Mixcloud. Your descriptions should be:

- Engaging and enticing to potential listeners
- Focused on the musical journey and flow
- Highlight key artists and genres
- Perfect for music discovery platforms
- Optimized for Mixcloud's audience

Create descriptions that make listeners excited to press play and discover new music through expertly curated tracklists.`,
        prompt: `Create a compelling show description for: \${topic}

Tracklist information: \${additionalContext}

CRITICAL REQUIREMENTS:
- Exactly 500-600 characters (including spaces)
- Perfect for Mixcloud audience
- Focus on musical journey and discovery
- Highlight key artists from the tracklist
- Mention genres and musical flow
- Create excitement and anticipation

Structure your description to include:
1. Opening hook that captures the show's essence
2. Key artists/tracks that define the journey
3. Musical themes, genres, or story arc
4. What makes this show special for discovery

REQUIREMENTS:
- Analyze the provided tracklist to identify standout artists and genres
- Create a narrative about the musical journey
- Use language that appeals to music discovery enthusiasts
- Stay within 500-600 character limit (strictly enforced)
- Focus on what makes listeners want to hit play
- Avoid generic phrases, be specific to this tracklist

Make every character count - this description determines whether someone discovers your carefully curated music.`,
        notes: 'Show descriptions must be 500-600 characters for Mixcloud optimization. Focus on musical discovery and track highlights.'
      }
    }
  }
}

// Save custom prompts
async function savePrompts(templates: any) {
  await ensureDataDirectory()
  await fs.writeFile(PROMPTS_FILE_PATH, JSON.stringify(templates, null, 2))
}

// GET - Return current prompt templates
export async function GET() {
  try {
    const templates = await loadPrompts()

    return NextResponse.json({
      success: true,
      templates,
      info: {
        source: 'custom',
        lastModified: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Error loading prompts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load prompts' },
      { status: 500 }
    )
  }
}

// POST - Save updated prompt templates
export async function POST(request: NextRequest) {
  try {
    const { templates } = await request.json()

    if (!templates) {
      return NextResponse.json(
        { success: false, error: 'Templates data is required' },
        { status: 400 }
      )
    }

    // Validate template structure
    const requiredContentTypes = ['artist-profile', 'deep-dive', 'blog-post', 'show-description']
    const requiredFields = ['system', 'prompt', 'notes']

    for (const contentType of requiredContentTypes) {
      if (!templates[contentType]) {
        return NextResponse.json(
          { success: false, error: `Missing template for ${contentType}` },
          { status: 400 }
        )
      }

      for (const field of requiredFields) {
        if (!templates[contentType][field]) {
          return NextResponse.json(
            { success: false, error: `Missing ${field} for ${contentType}` },
            { status: 400 }
          )
        }
      }
    }

    // Add metadata
    const templatesWithMetadata = {
      ...templates,
      _metadata: {
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      }
    }

    await savePrompts(templatesWithMetadata)

    return NextResponse.json({
      success: true,
      message: 'Prompts saved successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error saving prompts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save prompts' },
      { status: 500 }
    )
  }
}

// PUT - Reset to default templates
export async function PUT() {
  try {
    const defaultTemplates = {
      'artist-profile': {
        system: PROMPT_TEMPLATES['artist-profile'].system,
        prompt: PROMPT_TEMPLATES['artist-profile'].prompt('${topic}', '${additionalContext}', '${targetLength}'),
        notes: PROMPT_TEMPLATES['artist-profile'].notes
      },
      'deep-dive': {
        system: PROMPT_TEMPLATES['deep-dive'].system,
        prompt: PROMPT_TEMPLATES['deep-dive'].prompt('${topic}', '${additionalContext}', '${targetLength}'),
        notes: PROMPT_TEMPLATES['deep-dive'].notes
      },
      'blog-post': {
        system: PROMPT_TEMPLATES['blog-post'].system,
        prompt: PROMPT_TEMPLATES['blog-post'].prompt('${topic}', '${additionalContext}', '${targetLength}'),
        notes: PROMPT_TEMPLATES['blog-post'].notes
      },
      'show-description': {
        system: `You are a radio show curator and music discovery expert who creates compelling show descriptions for Mixcloud. Your descriptions should be:

- Engaging and enticing to potential listeners
- Focused on the musical journey and flow
- Highlight key artists and genres
- Perfect for music discovery platforms
- Optimized for Mixcloud's audience

Create descriptions that make listeners excited to press play and discover new music through expertly curated tracklists.`,
        prompt: `Create a compelling show description for: \${topic}

Tracklist information: \${additionalContext}

CRITICAL REQUIREMENTS:
- Exactly 500-600 characters (including spaces)
- Perfect for Mixcloud audience
- Focus on musical journey and discovery
- Highlight key artists from the tracklist
- Mention genres and musical flow
- Create excitement and anticipation

Structure your description to include:
1. Opening hook that captures the show's essence
2. Key artists/tracks that define the journey
3. Musical themes, genres, or story arc
4. What makes this show special for discovery

REQUIREMENTS:
- Analyze the provided tracklist to identify standout artists and genres
- Create a narrative about the musical journey
- Use language that appeals to music discovery enthusiasts
- Stay within 500-600 character limit (strictly enforced)
- Focus on what makes listeners want to hit play
- Avoid generic phrases, be specific to this tracklist

Make every character count - this description determines whether someone discovers your carefully curated music.`,
        notes: 'Show descriptions must be 500-600 characters for Mixcloud optimization. Focus on musical discovery and track highlights.'
      },
      _metadata: {
        lastUpdated: new Date().toISOString(),
        version: '1.0',
        resetToDefaults: true
      }
    }

    await savePrompts(defaultTemplates)

    return NextResponse.json({
      success: true,
      message: 'Reset to default prompts successfully',
      templates: defaultTemplates
    })

  } catch (error: any) {
    console.error('Error resetting prompts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset prompts' },
      { status: 500 }
    )
  }
}