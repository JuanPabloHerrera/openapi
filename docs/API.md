# API Documentation

Your AI Reseller API is fully compatible with the OpenAI API format, making it a drop-in replacement.

## Base URL

```
Production: https://your-worker.workers.dev
Development: http://localhost:8787
```

## Authentication

All API requests require an API key in the Authorization header:

```bash
Authorization: Bearer YOUR_API_KEY
```

Get your API key from the dashboard at `/dashboard/keys`.

## Endpoints

### Health Check

Check if the API is running.

```
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### Chat Completions

Create a chat completion (compatible with OpenAI format).

```
POST /v1/chat/completions
```

**Headers:**
- `Authorization: Bearer YOUR_API_KEY`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response:**

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  }
}
```

## Supported Models

All models available on OpenRouter are supported. Popular models include:

- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo`
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`
- `mistral-large`
- `llama-3.1-405b`

See the full list at [openrouter.ai/models](https://openrouter.ai/models).

## Usage with OpenAI SDKs

### Python

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://your-worker.workers.dev/v1"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

### Node.js

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'YOUR_API_KEY',
  baseURL: 'https://your-worker.workers.dev/v1'
});

const response = await client.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(response.choices[0].message.content);
```

### cURL

```bash
curl https://your-worker.workers.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

## Rate Limits

Default rate limits per user:

- **60 requests per minute**
- **1,000 requests per hour**
- **10,000 requests per day**

Rate limits can be customized in the dashboard or by contacting support.

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Invalid API key"
}
```

**Causes:**
- Missing Authorization header
- Invalid or expired API key
- Inactive API key

### 402 Payment Required

```json
{
  "error": "Insufficient credits",
  "required": 0.002,
  "available": 0.001
}
```

**Causes:**
- Account balance too low
- Purchase more credits in the dashboard

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded: 60 requests per minute"
}
```

**Causes:**
- Exceeded rate limit
- Wait before making more requests

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "Failed to proxy request"
}
```

**Causes:**
- OpenRouter API issues
- Network connectivity problems
- Contact support if persists

## Pricing

Pricing is based on token usage with a configurable markup over OpenRouter costs.

**Default Markup:** 20%

**Example Costs** (approximate):

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| GPT-3.5 Turbo | $0.60 | $1.80 |
| GPT-4 Turbo | $12.00 | $36.00 |
| Claude 3 Haiku | $0.30 | $1.50 |
| Claude 3 Sonnet | $3.60 | $18.00 |
| Claude 3 Opus | $18.00 | $90.00 |

*Prices include 20% markup. Actual costs may vary.*

## Billing

- **Credits** are deducted after each successful request
- Usage is calculated based on actual tokens used (from OpenRouter response)
- Failed requests do not consume credits
- All usage is logged and visible in the dashboard

## Best Practices

### 1. API Key Security

- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Use different keys for development and production

### 2. Error Handling

```javascript
try {
  const response = await client.chat.completions.create({...});
  console.log(response);
} catch (error) {
  if (error.status === 402) {
    console.error('Insufficient credits');
  } else if (error.status === 429) {
    console.error('Rate limited, retry after delay');
  } else {
    console.error('API error:', error);
  }
}
```

### 3. Rate Limit Handling

Implement exponential backoff:

```javascript
async function makeRequestWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      } else {
        throw error;
      }
    }
  }
}
```

### 4. Cost Optimization

- Use appropriate models (don't use GPT-4 when GPT-3.5 suffices)
- Set reasonable `max_tokens` limits
- Cache responses when possible
- Monitor usage in the dashboard

## Webhooks (Coming Soon)

Get notified about:
- Low balance warnings
- Rate limit exceeded events
- Unusual usage patterns

## Support

- Documentation: [docs/](../README.md)
- Dashboard: [your-dashboard-url/dashboard](https://your-dashboard-url/dashboard)
- Issues: [GitHub Issues](your-repo-url/issues)
