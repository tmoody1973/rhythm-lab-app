import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-sanity-webhook-secret')
  const expectedSecret = process.env.SANITY_WEBHOOK_SECRET

  if (!expectedSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { _type?: string; slug?: { current?: string } }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { _type, slug } = body
  const slugValue = slug?.current

  const revalidated: string[] = []

  if (_type === 'post') {
    revalidatePath('/blog')
    revalidated.push('/blog')
    if (slugValue) {
      revalidatePath(`/blog/${slugValue}`)
      revalidated.push(`/blog/${slugValue}`)
    }
  } else if (_type === 'deepDive') {
    revalidatePath('/deep-dives')
    revalidated.push('/deep-dives')
    if (slugValue) {
      revalidatePath(`/deep-dives/${slugValue}`)
      revalidated.push(`/deep-dives/${slugValue}`)
    }
  } else if (_type === 'artistProfile') {
    revalidatePath('/profiles')
    revalidated.push('/profiles')
    if (slugValue) {
      revalidatePath(`/profiles/${slugValue}`)
      revalidated.push(`/profiles/${slugValue}`)
    }
  } else if (_type === 'aboutPage') {
    revalidatePath('/about')
    revalidated.push('/about')
  } else if (_type === 'siteSettings') {
    revalidatePath('/')
    revalidated.push('/')
  } else if (_type === 'showOverride') {
    revalidatePath('/shows')
    revalidated.push('/shows')
  }

  return NextResponse.json({ revalidated, timestamp: new Date().toISOString() })
}
