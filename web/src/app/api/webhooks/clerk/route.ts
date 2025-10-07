import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { UserService } from '@/lib/user-service'

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.text()
  const body = JSON.parse(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', {
      status: 400,
    })
  }

  // Handle the webhook
  const { type, data } = evt
  console.log(`Clerk webhook with type of ${type} received`)

  try {
    switch (type) {
      case 'user.created':
        console.log('Processing user.created event:', data)
        
        // Create user in database when they sign up
        const email = data.email_addresses?.[0]?.email_address || ''
        const newUser = await UserService.getOrCreateUser(data.id, email)
        
        console.log('User created in database:', { 
          id: newUser.id, 
          email: newUser.email
        })
        break

      case 'user.updated':
        console.log('Processing user.updated event:', data)
        
        // Update user email if it changed
        const updatedEmail = data.email_addresses?.[0]?.email_address || ''
        if (updatedEmail) {
          await UserService.updateUserEmail(data.id, updatedEmail)
          console.log('User email updated in database')
        }
        break

      case 'user.deleted':
        console.log('Processing user.deleted event:', data)
        
        // Delete user from database when account is deleted
        if (data.id) {
          await UserService.deleteUser(data.id)
          console.log('User deleted from database')
        }
        break

      default:
        console.log(`Unhandled webhook type: ${type}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: `${type} event processed successfully` 
    })
  } catch (error) {
    console.error(`Error processing ${type} webhook:`, error)
    return NextResponse.json(
      { 
        error: `Failed to process ${type} event`,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}