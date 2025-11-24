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

  // Get the most recent user
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .order('created_at', { ascending: false })
    .limit(1)

  if (userError) {
    console.error('Error fetching user:', userError)
    return
  }

  if (!users || users.length === 0) {
    console.error('No users found')
    return
  }

  const user = users[0]
  console.log(`Found user: ${user.email} (${user.id})`)

  // Add $10 in credits
  const { data: balance, error: balanceError } = await supabase
    .from('balances')
    .update({ credits: 10.00 })
    .eq('user_id', user.id)
    .select()

  if (balanceError) {
    console.error('Error updating balance:', balanceError)
    return
  }

  console.log('✅ Successfully added $10.00 in credits!')
  console.log('Balance:', balance)
}

addCredits()
