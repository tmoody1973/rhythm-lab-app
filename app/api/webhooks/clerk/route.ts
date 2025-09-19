import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  // Verify webhook signature
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    })
  }

  const payload = await request.text()
  const body = JSON.parse(payload)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: any

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', {
      status: 400,
    })
  }

  // Handle the webhook
  const { type, data } = evt

  console.log(`Clerk webhook received: ${type}`)

  // Initialize Supabase client with service role for webhook access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    switch (type) {
      case 'user.created':
        await handleUserCreated(supabase, data)
        break
      case 'user.updated':
        await handleUserUpdated(supabase, data)
        break
      case 'user.deleted':
        await handleUserDeleted(supabase, data)
        break
      default:
        console.log(`Unhandled webhook type: ${type}`)
    }
  } catch (error) {
    console.error('Error handling webhook:', error)
    return new Response('Error occurred while processing webhook', {
      status: 500,
    })
  }

  return NextResponse.json({ message: 'Webhook processed successfully' })
}

async function handleUserCreated(supabase: any, userData: any) {
  console.log('Creating profile for Clerk user:', userData.id)

  // Generate a UUID for the profile (since Clerk IDs are strings, not UUIDs)
  const profileId = crypto.randomUUID()

  const profile = {
    id: profileId, // Generate UUID for database
    clerk_user_id: userData.id, // Store Clerk ID separately
    email: userData.email_addresses?.[0]?.email_address || '',
    username: userData.username || userData.email_addresses?.[0]?.email_address?.split('@')[0] || '',
    full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || null,
    avatar_url: userData.image_url || null,
    role: 'user', // Regular users get 'user' role
    is_premium: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .insert(profile)

  if (error) {
    console.error('Error creating profile:', error)
    throw error
  }

  console.log('Profile created successfully for user:', userData.id)
}

async function handleUserUpdated(supabase: any, userData: any) {
  console.log('Updating profile for Clerk user:', userData.id)

  const updates = {
    email: userData.email_addresses?.[0]?.email_address || '',
    username: userData.username || userData.email_addresses?.[0]?.email_address?.split('@')[0] || '',
    full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || null,
    avatar_url: userData.image_url || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('clerk_user_id', userData.id)

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }

  console.log('Profile updated successfully for user:', userData.id)
}

async function handleUserDeleted(supabase: any, userData: any) {
  console.log('Deleting profile for Clerk user:', userData.id)

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('clerk_user_id', userData.id)

  if (error) {
    console.error('Error deleting profile:', error)
    throw error
  }

  console.log('Profile deleted successfully for user:', userData.id)
}