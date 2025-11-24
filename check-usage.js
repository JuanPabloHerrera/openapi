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

  // Get the user
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .order('created_at', { ascending: false })
    .limit(1)

  const userId = users[0].id
  console.log('User ID:', userId)

  // Check balance
  const { data: balance } = await supabase
    .from('balances')
    .select('*')
    .eq('user_id', userId)
    .single()

  console.log('\n📊 Current Balance:')
  console.log(JSON.stringify(balance, null, 2))

  // Check usage logs
  const { data: usageLogs } = await supabase
    .from('usage_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  console.log('\n📝 Usage Logs:')
  console.log(JSON.stringify(usageLogs, null, 2))
}

checkUsage()
