# Middleware Integration Guide

## Overview

The Schwab API client uses a middleware pipeline architecture that allows you to
extend and customize its behavior. The middleware system has been designed to
ensure proper interaction between components.

> **Note**: The priority-based middleware ordering described in this document is
> considered legacy. The preferred approach is to use the simplified pipeline
> approach described in [simplified-middleware.md](./simplified-middleware.md).

## Legacy Middleware Priority Order

In the legacy approach, middleware components are applied in a specific order to
ensure proper functionality. The order follows these priority levels (from
highest to lowest):

1. **Authentication (Priority 600)** - Adds authentication tokens to requests
2. **Rate Limiting (Priority 400)** - Ensures your application stays within API
   rate limits
3. **Retry (Priority 200)** - Automatically retries failed requests with
   exponential backoff

This order is important because:

- Authentication must happen before other operations
- Rate limiting should occur before retry to properly control request flow
- Retry should be last to handle errors from earlier middleware

## Standard Middleware Components

### Authentication Middleware (`withTokenAuth`)

The `withTokenAuth` middleware automatically adds authentication tokens to
requests and handles token refresh when needed.

```typescript
import { withTokenAuth } from '@sudowealth/schwab-api'

// Basic usage (requires a TokenLifecycleManager)
const authMiddleware = withTokenAuth(tokenManager)

// Advanced usage with options
const authMiddleware = withTokenAuth({
	tokenManager,
	refreshExpiring: true,
	refreshThresholdMs: 300_000, // 5 minutes
})
```

### Rate Limiting Middleware (`withRateLimit`)

The `withRateLimit` middleware prevents your application from exceeding Schwab's
API rate limits by queuing requests as needed.

```typescript
import { withRateLimit } from '@sudowealth/schwab-api'

// Basic usage
const rateLimitMiddleware = withRateLimit(120, 60_000) // 120 requests per minute

// Advanced usage with options
const rateLimitMiddleware = withRateLimit({
	maxRequests: 120,
	windowMs: 60_000,
	applyToRetries: false, // Don't count retries toward rate limit
})
```

### Retry Middleware (`withRetry`)

The `withRetry` middleware automatically retries failed requests, focusing on
common error scenarios like rate limits (HTTP 429) and server errors (HTTP 5xx).

```typescript
import { withRetry } from '@sudowealth/schwab-api'

// Basic usage
const retryMiddleware = withRetry({ max: 3 })

// Advanced usage with options
const retryMiddleware = withRetry({
	max: 3, // Maximum retry attempts
	baseMs: 1000, // Starting delay (will be doubled for each retry)
	maxDelayMs: 30_000, // Maximum delay (caps exponential growth)
	respectRetryAfter: true, // Use server's Retry-After header
	skipRateLimitOnRetry: true, // Skip rate limiting on retry attempts
})
```

## Legacy: Using the MiddlewareRegistry

For advanced use cases, you can directly use the `MiddlewareRegistry` to manage
middleware ordering and priorities. However, this approach is considered legacy,
and you should prefer the simplified pipeline approach.

```typescript
import {
	MiddlewareRegistry,
	MiddlewarePriority,
	withRetry,
	withRateLimit,
	withTokenAuth,
	compose,
} from '@sudowealth/schwab-api'

// Create a registry instance
const registry = new MiddlewareRegistry()

// Register middleware with priorities
registry.register(
	withTokenAuth(tokenManager),
	MiddlewarePriority.AUTHENTICATION,
	'auth',
)
registry.register(withRateLimit(), MiddlewarePriority.RATE_LIMIT, 'rateLimit')
registry.register(withRetry(), MiddlewarePriority.RETRY, 'retry')

// Add custom middleware
registry.register(myLoggingMiddleware, MiddlewarePriority.HIGHEST, 'logging')

// Get ordered middleware functions and compose them
const chain = compose(...registry.getMiddlewareFunctions())

// Use the chain with fetch
const response = await chain(request)
```

## Modern Approach: Using the Pipeline

The recommended way to configure middleware is through the new pipeline
approach:

```typescript
import { createApiClient } from '@sudowealth/schwab-api'

const client = createApiClient({
	// Configuration options
	config: { environment: 'SANDBOX' },

	// Authentication token
	token: tokenManager,

	// Middleware pipeline configuration
	middleware: {
		// Configure specific middleware
		auth: {
			refreshExpiring: true,
			refreshThresholdMs: 300_000,
		},
		rateLimit: {
			maxRequests: 120,
			windowMs: 60_000,
		},
		retry: {
			max: 3,
			baseMs: 1000,
			maxDelayMs: 30_000,
		},

		// Add custom middleware in specific positions
		before: [myLoggingMiddleware],
		between: {
			authAndRateLimit: [myMetricsMiddleware],
		},
		custom: [myErrorHandlingMiddleware],
	},
})
```

## Deprecated: Old API Approaches

The following approaches are no longer supported:

- Using `middlewares` array to add middleware
- Using `enforceMiddlewareOrder` flag
- Using `useDefaultMiddlewares` flag to disable default middleware

These legacy options have been replaced by the more flexible and intuitive
pipeline configuration shown above.

```typescript
// Modern middleware configuration approach
import { createApiClient } from '@sudowealth/schwab-api'

const client = createApiClient({
	// Authentication
	token: tokenManager,

	// Middleware pipeline configuration
	middleware: {
		// Configure built-in middleware
		auth: {
			refreshExpiring: true,
			refreshThresholdMs: 300_000,
		},
		rateLimit: {
			maxRequests: 120,
			windowMs: 60_000,
		},
		retry: {
			max: 3,
			baseMs: 1000,
			maxDelayMs: 30_000,
		},

		// Add custom middleware at specific positions
		before: [myLoggingMiddleware],
		between: {
			authAndRateLimit: [myMetricsMiddleware],
		},
		custom: [myErrorHandlingMiddleware],
	},
})
```

## Middleware Interaction

Middleware components have been designed to work together through a shared
metadata system that prevents conflicts and double-processing.

### Key Interactions

1. **Rate Limiting and Retry**

   - When the retry middleware retries a rate-limited request, it signals to the
     rate limit middleware to skip the rate limit check for the retry (via
     `skipRateLimit` flag)
   - This prevents double-counting retries against your rate limit quota

2. **Authentication and Retry**
   - When authentication middleware refreshes a token, it marks the request so
     retry middleware knows the token is fresh
   - This prevents unnecessary token refresh operations during retries

## Custom Middleware Development

To create custom middleware that interacts well with the standard components:

```typescript
import {
	type Middleware,
	getMetadata,
	cloneRequestWithMetadata,
} from '@sudowealth/schwab-api'

const myCustomMiddleware: Middleware = async (req, next) => {
	// Get request metadata
	const metadata = getMetadata(req)

	// Check if this is a retry attempt
	if (metadata.retry?.isRetry) {
		console.log(
			`Retry attempt ${metadata.retry.attemptNumber}/${metadata.retry.maxAttempts}`,
		)
	}

	// Clone request with metadata if needed
	const clonedReq = cloneRequestWithMetadata(req)

	// Add your own metadata
	metadata.custom = { someValue: 123 }

	// Call next middleware
	const response = await next(clonedReq)

	// Get response metadata
	const responseMetadata = getMetadata(response)

	return response
}
```

## Best Practices

1. **Respect the Priority Order**

   - Use the standard priority constants for proper ordering
   - Authentication should come first, followed by rate limiting, then retry

2. **Use Metadata for Coordination**

   - Access shared metadata through `getMetadata(req)` and
     `getMetadata(response)`
   - Always clone requests with `cloneRequestWithMetadata()` before modifying
     them

3. **Handle Retry Scenarios**

   - Check `metadata.retry?.isRetry` to detect retry attempts
   - Implement special handling for retries when needed

4. **Rate Limiting Considerations**

   - Set conservative rate limits below the actual API limits
   - Consider setting `applyToRetries: false` to avoid counting retries

5. **Error Handling**
   - Let retry middleware handle retryable errors (don't retry manually)
   - Use appropriate error types to signal whether errors are retryable
