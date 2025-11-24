const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const crypto = require('crypto')

// Load env variables
const envContent = fs.readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const apiKey = process.argv[2]

if (!apiKey) {
  console.error('Please provide the API key as an argument')
  process.exit(1)
}

async function checkKey() {
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

  // Hash the key
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
  console.log('API Key:', apiKey)
  console.log('Key Hash:', keyHash)
  console.log()

  // Look up in database
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .single()

  if (error) {
    console.error('Error looking up key:', error)
  } else if (data) {
    console.log('✅ API key found in database:')
    console.log(JSON.stringify(data, null, 2))
  } else {
    console.log('❌ API key NOT found in database')

    // Show all keys for this user
    console.log('\nAll API keys in database:')
    const { data: allKeys } = await supabase
      .from('api_keys')
      .select('id, key_prefix, key_hash, is_active')

    console.log(JSON.stringify(allKeys, null, 2))
  }
}

checkKey()
