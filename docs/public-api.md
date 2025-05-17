# Public API Surface

This document outlines the public API surface of the Schwab API client library.
These are the components that are stable, supported, and safe to use in your
application code.

## Main Entry Points

### API Client

The primary entry point for using the Schwab API is the `createApiClient`
function:

```typescript
import { createApiClient } from 'schwab-api'

const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth: 'YOUR_ACCESS_TOKEN',
})
```

The client object provides access to all API endpoints through namespaces:

- `client.marketData`: Market data endpoints (quotes, price history, etc.)
- `client.trader`: Trading endpoints (accounts, orders, transactions, etc.)
- `client.auth`: Authentication utilities
- `client.errors`: Error types and utilities
- `client.schemas`: Schemas for API data validation

Each namespace contains domain-specific endpoint functions that correspond to
Schwab API endpoints.

## Authentication

For authentication, the library provides two main approaches:

### 1. Unified Auth Factory

```typescript
import { createSchwabAuth, AuthStrategy } from 'schwab-api'

const auth = createSchwabAuth({
	strategy: AuthStrategy.CODE_FLOW,
	oauthConfig: {
		clientId: 'YOUR_CLIENT_ID',
		clientSecret: 'YOUR_CLIENT_SECRET',
		redirectUri: 'YOUR_REDIRECT_URI',
		save: async (tokens) => {
			/* Save tokens */
		},
		load: async () => {
			/* Load tokens */
		},
	},
})
```

### 2. Direct Auth Client

```typescript
import { createSchwabAuthClient } from 'schwab-api'

const auth = createSchwabAuthClient({
	clientId: 'YOUR_CLIENT_ID',
	clientSecret: 'YOUR_CLIENT_SECRET',
	redirectUri: 'YOUR_REDIRECT_URI',
	save: async (tokens) => {
		/* Save tokens */
	},
	load: async () => {
		/* Load tokens */
	},
})
```

## Token Management

For token management, the library provides the following components:

```typescript
import {
	buildTokenManager,
	StaticTokenManager,
	createStaticTokenManager,
	ConcurrentTokenManager,
	type ITokenLifecycleManager,
} from 'schwab-api'
```

- `buildTokenManager`: Creates a token manager from various inputs
- `StaticTokenManager`: Simple implementation for static tokens
- `ConcurrentTokenManager`: Wrapper that ensures one refresh happens at a time
- `ITokenLifecycleManager`: Interface for custom token management

## Middleware

The library exposes key middleware components:

```typescript
import {
	compose,
	withTokenAuth,
	withRateLimit,
	withRetry,
	type Middleware,
} from 'schwab-api'
```

- `compose`: Utility to compose multiple middleware functions
- `withTokenAuth`: Add authentication headers and token refresh
- `withRateLimit`: Add rate limiting
- `withRetry`: Add automatic retries with exponential backoff
- `Middleware`: Type definition for middleware functions

## Error Handling

The library provides a comprehensive error system:

```typescript
import {
	SchwabError,
	SchwabApiError,
	SchwabAuthError,
	isSchwabError,
	isSchwabApiError,
} from 'schwab-api'
```

- `SchwabError`: Base class for all errors
- `SchwabApiError`: Error from API calls
- `SchwabAuthError`: Error from authentication
- Type guards to check error types

## Internal Components

The library maintains a clear separation between public and internal components.
Internal utilities and helper functions are not exported from the main module,
which:

1. Reduces the public API surface
2. Makes it clearer which parts of the API are stable and supported
3. Allows for more flexibility in refactoring internal components

**Important**: Do not rely on internal components that are not part of the
public API. These components may change without notice in any release.

## Using the `all` Namespace

For comprehensive access to all types and utilities, you can use the `all`
namespace:

```typescript
// Use the unified discovery namespace
const isRetryable = client.all.errors.isRetryableError(error)
```

This provides access to everything in a single structured object, making it
easier to discover available functionality.
