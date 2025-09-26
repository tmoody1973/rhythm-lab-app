import { NextRequest, NextResponse } from 'next/server'

interface ReleaseDetailsRequest {
  releaseId: string
  releaseType: 'release' | 'master'
}

interface ReleaseDetailsResponse {
  success: boolean
  release?: {
    id: number
    title: string
    artists: Array<{ name: string; role?: string }>
    year: number
    labels: Array<{ name: string; catno: string }>
    formats: Array<{ name: string; descriptions?: string[] }>
    tracklist: Array<{
      position: string
      title: string
      duration?: string
      artists?: Array<{ name: string }>
    }>
    images: Array<{ type: string; uri: string; width: number; height: number }>
    notes?: string
    genres: string[]
    styles: string[]
    country?: string
    released?: string
    discogs_url: string
    data_quality: string
  }
  message?: string
  error?: string
}

/**
 * POST /api/discogs/release-details
 * Fetch detailed information about a specific Discogs release
 *
 * EXPLANATION: This API endpoint acts as a bridge between our frontend
 * and the Discogs API. When a user clicks "View" on a release, this
 * endpoint fetches all the detailed information we need to show in
 * the expandable card.
 */
async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ReleaseDetailsRequest = await request.json()
    const { releaseId, releaseType = 'release' } = body

    if (!releaseId) {
      return NextResponse.json({
        success: false,
        error: 'Release ID is required'
      }, { status: 400 })
    }

    console.log(`[Release Details API] Fetching details for ${releaseType} ID: ${releaseId}`)

    // EXPLANATION: We determine which Discogs API endpoint to use
    // - 'masters' endpoint for master releases (main album versions)
    // - 'releases' endpoint for specific releases (like vinyl, CD versions)
    const endpoint = releaseType === 'master' ? 'masters' : 'releases'
    const url = `https://api.discogs.com/${endpoint}/${releaseId}`

    // EXPLANATION: We need to include our Discogs API credentials
    // The User-Agent is required by Discogs API rules
    const headers = {
      'Authorization': `Discogs token=${process.env.DISCOGS_API_TOKEN}`,
      'User-Agent': `${process.env.DISCOGS_USER_AGENT || 'RhythmLabRadio/1.0'}`
    }

    console.log(`[Release Details API] Calling Discogs API: ${url}`)

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error(`[Release Details API] Discogs API error: ${response.status} for URL: ${url}`)

      // Provide user-friendly error messages
      let errorMessage = 'Failed to fetch release details'
      if (response.status === 404) {
        errorMessage = `This ${releaseType} was not found in Discogs (ID: ${releaseId})`
      } else if (response.status === 429) {
        errorMessage = 'Too many requests to Discogs. Please try again later'
      } else if (response.status >= 500) {
        errorMessage = 'Discogs server error. Please try again later'
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: response.status })
    }

    const discogsData = await response.json()

    // EXPLANATION: Transform the raw Discogs API response into a cleaner format
    // that's easier for our frontend to work with. We're picking out the most
    // important fields and organizing them logically.
    const releaseDetails = {
      id: discogsData.id,
      title: discogsData.title,
      artists: discogsData.artists || [],
      year: discogsData.year || new Date(discogsData.released).getFullYear(),
      labels: discogsData.labels || [],
      formats: discogsData.formats || [],
      tracklist: discogsData.tracklist || [],
      images: discogsData.images || [],
      notes: discogsData.notes,
      genres: discogsData.genres || [],
      styles: discogsData.styles || [],
      country: discogsData.country,
      released: discogsData.released,
      discogs_url: `https://www.discogs.com/${releaseType}/${releaseId}`,
      data_quality: discogsData.data_quality || 'Unknown'
    }

    console.log(`[Release Details API] Successfully fetched details for "${releaseDetails.title}"`)

    return NextResponse.json({
      success: true,
      release: releaseDetails,
      message: `Successfully fetched details for ${releaseDetails.title}`
    })

  } catch (error) {
    console.error('[Release Details API] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch release details'
    }, { status: 500 })
  }
}

export { POST }