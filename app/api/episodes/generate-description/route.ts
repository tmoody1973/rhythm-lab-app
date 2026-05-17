import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import OpenAI from 'openai'

const sanityWriteClient = createClient({
  projectId: 'b9cutvrc',
  dataset: 'production',
  apiVersion: '2026-05-17',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface GenerateRequest {
  mixcloudKey: string
  title: string
  tracklist: Array<{ startTime: number; artistName: string; trackName: string }>
  tags: string[]
}

function tracklistToText(tracklist: GenerateRequest['tracklist']): string {
  return tracklist
    .slice(0, 15)
    .map(t => `${t.artistName} — ${t.trackName}`)
    .join(', ')
}

function textToPortableText(text: string): unknown[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => ({
      _type: 'block',
      _key: Math.random().toString(36).slice(2, 10),
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: Math.random().toString(36).slice(2, 10),
          text: line,
          marks: [],
        },
      ],
      markDefs: [],
    }))
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()
    const { mixcloudKey, title, tracklist, tags } = body

    if (!mixcloudKey || !title) {
      return NextResponse.json({ error: 'mixcloudKey and title are required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY || !process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Missing API keys' }, { status: 500 })
    }

    const tracklistText = tracklist?.length
      ? `Tracklist: ${tracklistToText(tracklist)}`
      : 'No tracklist available.'

    const tagText = tags?.length ? `Genres/tags: ${tags.join(', ')}.` : ''

    const prompt = `Write a 150-200 word editorial description for a Rhythm Lab Radio show episode titled "${title}". ${tracklistText}. ${tagText} Write in a warm, knowledgeable music journalist tone. Focus on the musical journey, the artists featured, and the sonic mood. Do not use phrases like "this episode" or "this show". Do not use markdown. Write in plain prose paragraphs.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
    })

    const generatedText = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!generatedText) {
      return NextResponse.json({ error: 'AI returned empty response' }, { status: 500 })
    }

    const portableText = textToPortableText(generatedText)

    const existing = await sanityWriteClient.fetch<{ _id: string } | null>(
      `*[_type == "showOverride" && mixcloudKey == $key][0]{_id}`,
      { key: mixcloudKey }
    )

    if (!existing) {
      return NextResponse.json({ error: 'Episode document not found in Sanity' }, { status: 404 })
    }

    await sanityWriteClient.patch(existing._id).set({ aiDescription: portableText }).commit()

    return NextResponse.json({ success: true, documentId: existing._id })
  } catch (error) {
    console.error('Episode description generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
