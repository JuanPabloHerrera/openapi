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

if (!userIdentifier) {
  console.error('❌ Please provide user ID or email as argument')
  console.error('Usage: node check-usage.js <user_id_or_email>')
  console.error('Example: node check-usage.js user@example.com')
  process.exit(1)
}

async function checkUsage() {
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
  console.log(`User: ${user.email} (${user.id})`)
  console.log()

  // Get balance
  const { data: balance, error: balanceError } = await supabase
    .from('balances')
    .select('credits')
    .eq('user_id', user.id)
    .single()

  if (balanceError) {
    console.error('❌ Error fetching balance:', balanceError)
  } else {
    console.log(`💰 Current Balance: $${balance.credits.toFixed(2)}`)
    console.log()
  }

  // Get usage logs
  const { data: logs, error: logsError } = await supabase
    .from('usage_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (logsError) {
    console.error('❌ Error fetching usage logs:', logsError)
  } else if (logs && logs.length > 0) {
    console.log('📊 Recent Usage (last 10):')
    logs.forEach((log, i) => {
      console.log(`\n${i + 1}. ${new Date(log.created_at).toLocaleString()}`)
      console.log(`   Model: ${log.model}`)
      console.log(`   Status: ${log.status}`)
      console.log(`   Tokens: ${log.total_tokens}`)
      console.log(`   Cost: $${log.cost_usd.toFixed(4)}`)
    })
  } else {
    console.log('ℹ️  No usage logs found')
  }
}

checkUsage()
