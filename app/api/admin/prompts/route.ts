import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PROMPT_TEMPLATES } from '@/lib/ai/prompt-templates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Load custom prompts from database or return defaults
async function loadPrompts() {
  try {
    const { data: templates, error } = await supabase
      .from('prompt_templates')
      .select('*')

    if (error) throw error

    // Convert database rows to template format
    if (templates && templates.length > 0) {
      const result: any = {}
      for (const template of templates) {
        result[template.content_type] = {
          system: template.system_prompt,
          prompt: template.user_prompt,
          notes: template.notes
        }
      }
      return result
    }

    // Return default templates if no custom templates in database
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
  } catch (error) {
    console.error('Error loading prompts:', error)
    throw error
  }
}

// Save custom prompts to database
async function savePrompts(templates: any) {
  // Convert templates to database rows
  const updates = []
  for (const [contentType, template] of Object.entries(templates)) {
    if (contentType === '_metadata') continue // Skip metadata

    const t = template as any
    updates.push({
      content_type: contentType,
      system_prompt: t.system,
      user_prompt: t.prompt,
      notes: t.notes || ''
    })
  }

  // Update each template individually
  for (const update of updates) {
    // Try to update first
    const { data: existing } = await supabase
      .from('prompt_templates')
      .select('id')
      .eq('content_type', update.content_type)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('prompt_templates')
        .update({
          system_prompt: update.system_prompt,
          user_prompt: update.user_prompt,
          notes: update.notes,
          updated_at: new Date().toISOString()
        })
        .eq('content_type', update.content_type)

      if (error) {
        console.error('Update error:', error)
        throw error
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('prompt_templates')
        .insert(update)

      if (error) {
        console.error('Insert error:', error)
        throw error
      }
    }
  }
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
      {
        success: false,
        error: 'Failed to save prompts',
        details: error.message || error.toString()
      },
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