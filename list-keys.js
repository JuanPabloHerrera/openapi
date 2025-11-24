const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Load env variables
const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

async function listKeys() {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  console.log('🔍 Fetching all API keys from database...\n')

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, key_prefix, key_hash, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching keys:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No API keys found in database')
    console.log('\nPlease create an API key through the dashboard:')
    console.log('1. Go to http://localhost:3000/dashboard/keys')
    console.log('2. Click "Create New API Key"')
    console.log('3. Copy the generated key')
    return
  }

  console.log(`✅ Found ${data.length} API key(s):\n`)
  data.forEach((key, index) => {
    console.log(`Key ${index + 1}:`)
    console.log(`  ID: ${key.id}`)
    console.log(`  User ID: ${key.user_id}`)
    console.log(`  Prefix: ${key.key_prefix}`)
    console.log(`  Hash: ${key.key_hash}`)
    console.log(`  Active: ${key.is_active ? '✅' : '❌'}`)
    console.log(`  Created: ${key.created_at}`)
    console.log()
  })

  console.log('\n⚠️  Note: The full API keys are not stored in the database.')
  console.log('If you lost your API key, you need to create a new one.')
}

listKeys()
