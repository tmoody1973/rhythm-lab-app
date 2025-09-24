import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Lightweight endpoint to record successful Mixcloud uploads
 * The actual upload is done client-side to bypass serverless limits
 */
async function recordUpload(request: NextRequest, user: any) {
  try {
    const data = await request.json()
    const {
      showTitle,
      showDescription,
      showTags,
      publishDate,
      playlistText,
      parsedTracks,
      mixcloudUrl,
      uploadDetails
    } = data

    // Use service role client to bypass RLS
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )

    // Get the user's profile UUID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile lookup failed:', profileError, 'for Clerk user:', user.id)
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 400 }
      )
    }

    // Create upload job record
    const { data: uploadJob, error: jobError } = await supabase
      .from('upload_jobs')
      .insert({
        user_id: profile.id,
        filename: `mixcloud_${Date.now()}.mp3`,
        original_filename: showTitle,
        file_size: 0, // Not tracked for client-side uploads
        content_type: 'audio/mpeg',
        show_title: showTitle,
        show_description: showDescription || '',
        show_tags: showTags || [],
        publish_date: publishDate,
        playlist_text: playlistText || '',
        parsed_tracks: parsedTracks || [],
        status: 'uploaded',
        mixcloud_url: mixcloudUrl,
        mixcloud_embed: uploadDetails?.embed || '',
        mixcloud_picture: uploadDetails?.picture || '',
        progress_percentage: 100,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError || !uploadJob) {
      console.error('Failed to create upload record:', jobError)
      return NextResponse.json(
        { success: false, message: 'Failed to record upload' },
        { status: 500 }
      )
    }

    // TODO: Trigger sync to Storyblok if needed
    console.log('Upload recorded successfully:', uploadJob.id)

    return NextResponse.json({
      success: true,
      jobId: uploadJob.id,
      message: 'Upload recorded successfully'
    })
  } catch (error) {
    console.error('Record upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to record upload' },
      { status: 500 }
    )
  }
}

export const POST = withAdminAuth(recordUpload)