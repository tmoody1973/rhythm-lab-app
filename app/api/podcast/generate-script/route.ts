import { NextRequest, NextResponse } from 'next/server'
import { loadCustomPrompts } from '@/lib/utils/prompt-loader'

interface ScriptLine {
  speaker: 'Samara' | 'Carl'
  text: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, additionalContext = '' } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Load the custom podcast script prompt from the admin-managed prompts
    const prompts = await loadCustomPrompts()
    const podcastPrompt = prompts['podcast-script']

    if (!podcastPrompt) {
      return NextResponse.json(
        { error: 'Podcast script prompt not configured' },
        { status: 500 }
      )
    }

    // Replace template variables in the prompt
    const finalPrompt = podcastPrompt.prompt
      .replace('${content}', content)
      .replace('${additionalContext}', additionalContext)

    console.log('Generating podcast script with Perplexity API...')

    // Call Perplexity API for script generation
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: podcastPrompt.system
          },
          {
            role: 'user',
            content: finalPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 0.9,
        return_citations: false,
        return_images: false,
        return_related_questions: false
      })
    })

    if (!perplexityResponse.ok) {
      const error = await perplexityResponse.text()
      console.error('Perplexity API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate script with Perplexity API', details: error },
        { status: 500 }
      )
    }

    const perplexityData = await perplexityResponse.json()
    const scriptContent = perplexityData.choices?.[0]?.message?.content

    if (!scriptContent) {
      return NextResponse.json(
        { error: 'No script content generated' },
        { status: 500 }
      )
    }

    // Parse the JSON script from the response
    let scriptLines: ScriptLine[]
    try {
      // Extract JSON from the response (in case it's wrapped in markdown code blocks)
      const jsonMatch = scriptContent.match(/```json\s*([\s\S]*?)\s*```/) ||
                       scriptContent.match(/\[([\s\S]*)\]/)

      if (jsonMatch) {
        scriptLines = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        scriptLines = JSON.parse(scriptContent)
      }

      // Validate the script format
      if (!Array.isArray(scriptLines)) {
        throw new Error('Script must be an array')
      }

      // Validate each line has required fields
      for (const line of scriptLines) {
        if (!line.speaker || !line.text || !['Samara', 'Carl'].includes(line.speaker)) {
          throw new Error('Invalid script line format')
        }
      }

    } catch (parseError) {
      console.error('Failed to parse script JSON:', parseError)
      return NextResponse.json(
        {
          error: 'Failed to parse generated script',
          details: parseError.message,
          rawContent: scriptContent
        },
        { status: 500 }
      )
    }

    console.log(`Generated script with ${scriptLines.length} lines`)

    return NextResponse.json({
      success: true,
      script: scriptLines,
      metadata: {
        generatedAt: new Date().toISOString(),
        lineCount: scriptLines.length,
        estimatedDuration: Math.round(scriptLines.length * 0.8) + ' minutes' // Rough estimate
      }
    })

  } catch (error: any) {
    console.error('Script generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate podcast script',
        details: error.message
      },
      { status: 500 }
    )
  }
}