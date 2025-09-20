import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG CLERK START ===')

    // Test Clerk auth
    const authResult = await auth()
    console.log('Clerk auth result:', {
      userId: authResult.userId,
      sessionId: authResult.sessionId,
      orgId: authResult.orgId
    })

    if (!authResult.userId) {
      return NextResponse.json({
        error: 'No Clerk user found',
        authResult: authResult
      }, { status: 401 })
    }

    // Test Clerk client
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    console.log('Clerk client initialized')

    try {
      const clerkUser = await client.users.getUser(authResult.userId)
      console.log('Clerk user fetched:', {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        fullName: clerkUser.fullName,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName
      })

      return NextResponse.json({
        success: true,
        userId: authResult.userId,
        userEmail: clerkUser.primaryEmailAddress?.emailAddress,
        userFullName: clerkUser.fullName,
        debug: 'Clerk integration working properly'
      })

    } catch (clerkError: any) {
      console.log('Error fetching user from Clerk:', clerkError)
      return NextResponse.json({
        error: 'Failed to fetch user from Clerk',
        clerkError: clerkError?.message || 'Unknown error',
        userId: authResult.userId
      }, { status: 500 })
    }

  } catch (error: any) {
    console.log('Error in debug endpoint:', error)
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}