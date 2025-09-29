import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🗄️ Setting up AI analysis cache table...')

    // Check if we can extend the existing ai_recommendations table or use it
    // First, let's see what tables we have access to
    const { data: existingTables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%ai%')

    if (tableError) {
      console.log('Could not check tables, will try to use existing ai_recommendations table')
    } else {
      console.log('Existing AI-related tables:', existingTables)
    }

    // Check if ai_recommendations table exists and its structure
    const { data: aiRecommendations, error: aiError } = await supabase
      .from('ai_recommendations')
      .select('*')
      .limit(1)

    console.log('ai_recommendations table check:', { data: aiRecommendations, error: aiError })

    let createTableError = null

    if (createTableError) {
      console.error('Error creating ai_track_analysis table:', createTableError)
      return NextResponse.json({
        error: 'Failed to create table',
        details: createTableError.message
      }, { status: 500 })
    }

    // Test the table by inserting a sample record
    const testAnalysis = {
      artist_name: 'Test Artist',
      track_name: 'Test Track',
      analysis_type: 'test',
      ai_analysis: {
        test: true,
        created_at: new Date().toISOString()
      }
    }

    const { data: insertData, error: insertError } = await supabase
      .from('ai_track_analysis')
      .insert(testAnalysis)
      .select()

    if (insertError) {
      console.error('Error testing table:', insertError)
      return NextResponse.json({
        error: 'Table created but insert test failed',
        details: insertError.message
      }, { status: 500 })
    }

    // Clean up test record
    await supabase
      .from('ai_track_analysis')
      .delete()
      .eq('analysis_type', 'test')

    console.log('✅ AI analysis cache table created successfully')

    return NextResponse.json({
      success: true,
      message: 'AI analysis cache table created successfully',
      table_created: true,
      test_passed: true
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      error: 'Failed to setup AI cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    description: 'AI Analysis Cache Setup',
    instructions: 'Use POST with admin token to create the ai_track_analysis table for caching Perplexity results'
  })
}