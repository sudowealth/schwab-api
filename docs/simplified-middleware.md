# Middleware Pipeline Guide

## Overview

The Schwab API client uses a middleware pipeline approach that makes it easier
to configure and understand how middleware components interact. This approach
uses a straightforward pipeline model for predictable middleware execution.

## Key Benefits

- **Simpler Configuration**: More intuitive options with less boilerplate
- **Clear Execution Order**: Predictable middleware sequence without priority
  numbers
- **Enhanced Control**: Place custom middleware at specific points in the
  pipeline
- **Backward Compatible**: Existing code using the priority-based approach
  continues to work with deprecation warnings

## Basic Usage

```typescript
import { createApiClient } from '@sudowealth/schwab-api'

// Create a client with default middleware
const client = createApiClient({
	config: { environment: 'SANDBOX' },
	token: myTokenManager,
})
```

With this simplified approach, you'll get all the standard middleware
components:

1. Authentication middleware (if token is provided)
2. Rate limiting middleware (120 requests per minute)
3. Retry middleware (3 retries with exponential backoff)

## Customizing Middleware

### Configuring Default Middleware

```typescript
import { createApiClient } from '@sudowealth/schwab-api'

const client = createApiClient({
	config: { environment: 'SANDBOX' },
	token: myTokenManager,
	middleware: {
		// Configure auth middleware
		auth: {
			refreshExpiring: true,
			refreshThresholdMs: 300_000, // 5 minutes
		},

		// Configure rate limiting
		rateLimit: {
			maxRequests: 60,
			windowMs: 60_000, // 1 minute
		},

		// Configure retry behavior
		retry: {
			max: 5,
			baseMs: 2000,
			maxDelayMs: 60_000,
		},
	},
})
```

### Disabling Middleware

```typescript
import { createApiClient } from '@sudowealth/schwab-api'

const client = createApiClient({
	config: { environment: 'SANDBOX' },
	token: myTokenManager,
	middleware: {
		// Disable specific middleware components
		disable: ['rateLimit', 'retry'],

		// Or disable individual components with false
		rateLimit: false,
	},
})
```

### Adding Custom Middleware

You can add custom middleware at different points in the pipeline:

```typescript
import { createApiClient } from '@sudowealth/schwab-api'

const client = createApiClient({
	config: { environment: 'SANDBOX' },
	token: myTokenManager,
	middleware: {
		// Add middleware at the beginning of the chain (executed first)
		before: [loggingMiddleware],

		// Add middleware between specific components
		between: {
			// Execute after auth but before rate limiting
			authAndRateLimit: [metricsMiddleware],

			// Execute after rate limiting but before retry
			rateLimitAndRetry: [cacheMiddleware],
		},

		// Add middleware at the end of the chain (executed last)
		custom: [errorReportingMiddleware],
	},
})
```

## Middleware Pipeline Order

The middleware is executed in this specific order:

1. `before` middleware (if provided)
2. Authentication middleware (if token is provided and not disabled)
3. `between.authAndRateLimit` middleware (if provided)
4. Rate limiting middleware (if not disabled)
5. `between.rateLimitAndRetry` middleware (if provided)
6. Retry middleware (if not disabled)
7. `custom` middleware (if provided)

This order ensures proper interaction between middleware components.

## Creating Custom Middleware

Custom middleware follows the same pattern as before:

```typescript
import { type Middleware } from '@sudowealth/schwab-api'

const myLoggingMiddleware: Middleware = async (req, next) => {
	console.log(`Request: ${req.method} ${req.url}`)

	const startTime = Date.now()
	const response = await next(req)
	const duration = Date.now() - startTime

	console.log(`Response: ${response.status} (${duration}ms)`)

	return response
}
```

## Migration from Legacy Approach

If you're currently using the registry-based approach, here's how to migrate:

### Legacy Code:

```typescript
import { createApiClient, MiddlewarePriority } from '@sudowealth/schwab-api'

const client = createApiClient({
	config: { environment: 'SANDBOX' },
	token: myTokenManager,
	rateLimit: { limit: 60, windowMs: 60000 },
	retry: false,
	middlewares: [
		{
			middleware: myLoggingMiddleware,
			priority: MiddlewarePriority.HIGHEST,
			name: 'logging',
		},
	],
})
```

### Simplified Replacement:

```typescript
import { createApiClient } from '@sudowealth/schwab-api'

const client = createApiClient({
	config: { environment: 'SANDBOX' },
	token: myTokenManager,
	middleware: {
		rateLimit: { maxRequests: 60, windowMs: 60000 },
		retry: false,
		before: [myLoggingMiddleware],
	},
})
```

## Advanced Scenario: Using the Pipeline Directly

For advanced use cases, you can build and compose the middleware pipeline
directly:

```typescript
import { compose, buildMiddlewarePipeline } from '@sudowealth/schwab-api'

// Build a custom middleware pipeline
const middlewares = buildMiddlewarePipeline(
	{
		auth: { refreshExpiring: true },
		rateLimit: { maxRequests: 60, windowMs: 60000 },
		custom: [myCustomMiddleware],
	},
	tokenManager,
)

// Compose the middleware chain
const chain = compose(...middlewares)

// Use the chain with fetch
const response = await chain(request)
```

## Best Practices

1. **Start Simple**: Begin with the default middleware and only customize as
   needed
2. **Be Mindful of Order**: Remember that middleware executes in a specific
   sequence
3. **Use Precise Placement**: When adding custom middleware, place it at the
   appropriate point for optimal interaction
4. **Disable Sparingly**: Only disable middleware components when you have a
   specific reason
5. **Consistent Configuration**: Keep middleware configuration consistent across
   your application
