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
    const requiredContentTypes = ['artist-profile', 'deep-dive', 'blog-post']
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