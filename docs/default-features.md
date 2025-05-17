# Default Features in Schwab API Client

The Schwab API client comes with several powerful features enabled by default to
provide a robust, production-ready experience out of the box.

## 1. Concurrency-Safe Token Refresh

When you provide a token manager that supports refresh to the `createApiClient`
function, it is automatically enhanced with concurrency protection.

### What This Means:

- **Automatic Race Condition Prevention**: When multiple requests detect an
  expired token simultaneously, only one refresh operation is performed
- **Simplified Usage**: You don't need to manually create concurrency protection
- **Reduced API Calls**: Prevents redundant token refresh calls to Schwab's
  authentication servers

### Example:

```typescript
import { createSchwabAuthClient, createApiClient } from 'schwab-api'

// Create an auth client that supports token refresh
const auth = createSchwabAuthClient({
	clientId: 'your-client-id',
	clientSecret: 'your-client-secret',
	redirectUri: 'your-redirect-uri',
})

// Just pass it directly - concurrency protection is added automatically
const client = createApiClient({
	token: auth,
})
```

## 2. Automatic Rate Limiting

The client includes built-in rate limiting to prevent your application from
exceeding Schwab's API rate limits.

### Default Configuration:

- 120 requests per minute (60,000 ms window)
- Requests exceeding this limit are automatically queued and processed when the
  rate limit window resets

### Benefits:

- **Prevent 429 Errors**: Avoids "Too Many Requests" responses
- **Smooth Request Flow**: Maintains consistent API access during high-volume
  operations
- **Request Fairness**: Ensures all parts of your application get fair access to
  the API

## 3. Automatic Retries with Exponential Backoff

The client automatically retries failed requests that are likely to succeed on a
subsequent attempt.

### Default Configuration:

- Up to 3 retry attempts
- Exponential backoff starting at 1000ms (1 second)
- 10% jitter to prevent thundering herd problems
- Retries on HTTP 429 (Too Many Requests) and 5xx (Server Error) responses

### Benefits:

- **Resilience**: Handles transient failures gracefully
- **Self-Healing**: Recovers from temporary outages or hiccups
- **Smart Backoff**: Increasing delays give systems time to recover

## Customizing or Disabling Default Features

While these features are enabled by default, you can customize or disable them
as needed.

### To Use Custom Middleware Settings:

```typescript
// Override default rate limit settings
const client = createApiClient({
	token: myTokenManager,
	middlewares: [
		withRateLimit(240, 60000), // 240 requests per minute instead of default 120
		withRetry({ max: 5, baseMs: 500 }), // 5 retries with 500ms base delay
	],
})
```

### To Disable Default Middleware:

```typescript
// Disable specific middleware
const client = createApiClient({
	token: myTokenManager,
	middleware: {
		rateLimit: false, // Disable rate limiting
		retry: false, // Disable retry
	},
})

// Or configure with your own specific middleware
const client = createApiClient({
	token: myTokenManager,
	middleware: {
		rateLimit: false, // Disable default rate limiting
		retry: false, // Disable default retry
		custom: [
			withCustomMiddleware(), // Your custom middleware
			withRateLimit(50, 10000), // Custom rate limit with your settings
		],
	},
})
```

## How Default Features Work Together

These default features work together to create a robust API client:

1. **First Layer**: Rate limiting ensures you stay within API constraints
2. **Second Layer**: If a request fails despite rate limiting, retry logic
   attempts to recover
3. **Auth Layer**: Token refresh is concurrency-safe, preventing refresh
   collisions during high-volume operations

The result is a client that "just works" in production scenarios without
requiring extensive configuration.
