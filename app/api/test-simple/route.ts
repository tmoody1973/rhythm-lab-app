import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('Testing basic Supabase connection...')

    // Test basic connection by listing tables
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error.message,
        env_check: {
          has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      profiles_count: data,
      env_check: {
        has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })

  } catch (error) {
    console.error('Connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}