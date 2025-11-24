// Test script for making API calls to your Worker
// Usage: node test-api.js YOUR_API_KEY

const apiKey = process.argv[2]

if (!apiKey) {
  console.error('❌ Please provide your API key as an argument')
  console.error('Usage: node test-api.js YOUR_API_KEY')
  process.exit(1)
}

async function testAPI() {
  console.log('🚀 Testing API call to Worker...\n')

  const requestBody = {
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    messages: [
      {
        role: 'user',
        content: 'Say "Hello from OpenRouter!" in a single sentence.'
      }
    ],
    max_tokens: 50
  }

  console.log('Request:', JSON.stringify(requestBody, null, 2))
  console.log('\nCalling http://localhost:8787/v1/chat/completions...\n')

  try {
    const response = await fetch('http://localhost:8787/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log(`Status: ${response.status} ${response.statusText}`)

    const data = await response.json()
    console.log('\nResponse:', JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('\n✅ Success! API call completed.')
      console.log('\nCheck your dashboard at http://localhost:3000/dashboard/usage to see the usage log!')
    } else {
      console.log('\n❌ Request failed')
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

testAPI()
