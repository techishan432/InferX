# InferX API Reference

Base URL: `https://your-inferx-instance.vercel.app` (or `http://localhost:3000` for local dev).

All routes use Next.js App Router Route Handlers. Authentication via Freighter wallet session cookies.

## Authentication

### POST `/api/auth/connect`
Connect a Freighter wallet and establish a session.

**Request body:**
```json
{
  "publicKey": "G...",
  "signedMessage": "...",
  "signature": "..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "clx...",
    "publicKey": "G...",
    "displayName": "Alice",
    "isProvider": false,
    "isConsumer": true
  }
}
```

### POST `/api/auth/disconnect`
Clear the current session cookie.

### GET `/api/auth/me`
Return current user or 401.

## Endpoints (Marketplace)

### GET `/api/endpoints`
List all active endpoints with provider info.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `search` | string | Search model name / provider name |
| `supportsVision` | boolean | Filter vision-capable endpoints |
| `supportsStreaming` | boolean | Filter streaming-capable endpoints |
| `sortBy` | string | `price`, `rating`, `popularity`, `latency` |
| `sortOrder` | string | `asc` or `desc` |

**Response:**
```json
{
  "endpoints": [
    {
      "id": "clx...",
      "model": "gpt-4o",
      "providerName": "OpenAI Direct",
      "pricePerRequest": "0.05",
      "supportsVision": true,
      "supportsStreaming": true,
      "maxContextTokens": 128000,
      "averageRating": 4.5,
      "totalRequests": 1234,
      "healthStatus": "ONLINE",
      "provider": {
        "id": "clx...",
        "displayName": "OpenAI Direct",
        "walletAddress": "G..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### GET `/api/endpoints/[id]`
Get a single endpoint with full details including:
- Recent transactions count
- Provider's full profile
- Last 5 health checks
- Last 10 ratings with reviewer info

## Providers

### POST `/api/providers`
Register the current user as a provider.

**Request body:**
```json
{
  "displayName": "My Provider",
  "description": "We host GPT models at cheap rates",
  "website": "https://example.com"
}
```

### GET `/api/providers/[id]`
Get a provider's profile with endpoints and stats.

### GET `/api/providers/[id]/endpoints`
List all endpoints owned by the provider.

## Inference

### POST `/api/inference/[endpointId]`
Run a non-streaming inference request. Creates an escrow, calls the provider's API, releases payment on success.

**Request body:**
```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant" },
    { "role": "user", "content": "Hello!" }
  ],
  "temperature": 0.7,
  "maxTokens": 500
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "role": "assistant",
    "content": "Hello! How can I help you today?"
  },
  "usage": {
    "promptTokens": 15,
    "completionTokens": 10,
    "totalTokens": 25
  },
  "cost": "0.05",
  "transactionHash": "abc123..."
}
```

### POST `/api/inference/[endpointId]/stream`
SSE streaming inference. Response is a `text/event-stream` with chunks:
```
data: {"type":"chunk","content":"Hello"}

data: {"type":"chunk","content":" world"}

data: {"type":"done","usage":{"totalTokens":25},"cost":"0.05","transactionHash":"abc123..."}
```

## Transactions

### GET `/api/transactions`
List transactions for the current user (consumer or provider).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `endpointId` | string | Filter by endpoint |
| `success` | boolean | Filter by success status |
| `from` | ISO date | Start date |
| `to` | ISO date | End date |

### GET `/api/transactions/[id]`
Get details of a single transaction including on-chain hash.

## Ratings

### POST `/api/ratings`
Submit a rating for a transaction / endpoint.

**Request body:**
```json
{
  "transactionId": "clx...",
  "rating": 5,
  "comment": "Fast and accurate"
}
```

### GET `/api/ratings/[endpointId]`
Get all ratings for an endpoint.

## Dashboard

### GET `/api/dashboard/stats`
Get current user's dashboard statistics:
- Total spent (consumer) or earned (provider)
- Total transactions
- Average rating given/received
- Recent activity

## Health

### GET `/api/health`
API health check for monitoring. Returns:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "ok",
  "stellar": "ok"
}
```

## Error Responses

All errors follow a standard format:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Human-readable description",
    "details": {}
  }
}
```

Common error codes:
- `UNAUTHORIZED` (401) — No valid session
- `FORBIDDEN` (403) — Not allowed to perform this action
- `NOT_FOUND` (404) — Resource not found
- `VALIDATION_ERROR` (400) — Invalid request body
- `ESCROW_FAILED` (500) — Payment/escrow error
- `INFERENCE_FAILED` (502) — Provider API returned error
- `RATE_LIMIT_EXCEEDED` (429) — Too many requests
