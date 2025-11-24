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

// Get user identifier from command line
const userIdentifier = process.argv[2]
const amountToAdd = parseFloat(process.argv[3]) || 10.00

if (!userIdentifier) {
  console.error('❌ Please provide user ID or email as first argument')
  console.error('Usage: node add-credits.js <user_id_or_email> [amount]')
  console.error('Example: node add-credits.js user@example.com 25.00')
  process.exit(1)
}

async function addCredits() {
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

  // Find user by ID or email
  let query = supabase.from('users').select('id, email')

  if (userIdentifier.includes('@')) {
    query = query.eq('email', userIdentifier)
  } else {
    query = query.eq('id', userIdentifier)
  }

  const { data: users, error: userError } = await query.limit(1)

  if (userError) {
    console.error('❌ Error fetching user:', userError)
    return
  }

  if (!users || users.length === 0) {
    console.error(`❌ No user found with identifier: ${userIdentifier}`)
    return
  }

  const user = users[0]
  console.log(`Found user: ${user.email} (${user.id})`)
  console.log(`Adding $${amountToAdd.toFixed(2)} in credits...`)

  // Use RPC function to add credits (doesn't overwrite, adds to existing)
  const { error: addError } = await supabase.rpc('add_credits', {
    p_user_id: user.id,
    p_amount: amountToAdd,
  })

  if (addError) {
    console.error('❌ Error adding credits:', addError)
    return
  }

  // Get updated balance
  const { data: balance } = await supabase
    .from('balances')
    .select('credits')
    .eq('user_id', user.id)
    .single()

  console.log(`✅ Successfully added $${amountToAdd.toFixed(2)} in credits!`)
  console.log(`New balance: $${balance?.credits.toFixed(2) || '0.00'}`)
}

addCredits()
