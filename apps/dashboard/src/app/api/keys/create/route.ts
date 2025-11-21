import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()

    // Get authenticated user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate API key
    const apiKey = generateApiKey()
    const keyHash = hashKey(apiKey)
    const keyPrefix = apiKey.substring(0, 12) // e.g., "sk_live_abc1"

    // Store in database
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        user_id: user.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: name,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create API key:', error)
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    // Return the plain API key (only time it's visible)
    return NextResponse.json({ apiKey, id: data.id })

  } catch (error) {
    console.error('API key creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateApiKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  const randomString = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `sk_live_${randomString}`
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}
