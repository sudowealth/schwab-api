# Schwab API Authentication Architecture

This document explains the authentication architecture for the Schwab API client
library. The library provides a unified authentication approach that supports
multiple authentication strategies while maintaining a consistent interface.

## Authentication Concepts

The Schwab API uses OAuth 2.0 for authentication, and the library provides
several ways to handle authentication:

1. **Code Flow**: Complete OAuth implementation with authorization URL
   generation, code exchange, and token refresh.
2. **Static Token**: Simple authentication with a fixed access token.
3. **Custom Token Management**: Advanced use cases where you need complete
   control over token handling.

## Authentication Approaches

### Recommended Approach: Using `createSchwabAuth()`

The recommended way to authenticate is to use the `createSchwabAuth()` factory
function, which provides a unified interface for all authentication strategies:

```typescript
import { createSchwabAuth, AuthStrategy, createApiClient } from 'schwab-api'

// Create a unified auth client with your preferred authentication strategy
const auth = createSchwabAuth({
	strategy: AuthStrategy.CODE_FLOW,
	oauthConfig: {
		clientId: 'your-client-id',
		clientSecret: 'your-client-secret',
		redirectUri: 'your-redirect-uri',
		// Optional storage handlers
		save: async (tokens) =>
			localStorage.setItem('tokens', JSON.stringify(tokens)),
		load: async () => JSON.parse(localStorage.getItem('tokens') || 'null'),
	},
})

// Then pass the auth client to createApiClient
const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth,
})
```

### OAuth Code Flow Authentication

For web and mobile applications that need to authenticate users using the
standard OAuth flow:

```typescript
import { createSchwabAuth, AuthStrategy, createApiClient } from 'schwab-api'

// Step 1: Create an auth client with OAuth config
const auth = createSchwabAuth({
	strategy: AuthStrategy.CODE_FLOW,
	oauthConfig: {
		clientId: 'your-client-id',
		clientSecret: 'your-client-secret',
		redirectUri: 'your-redirect-uri',
		save: async (tokens) => saveToDatabase(tokens),
		load: async () => loadFromDatabase(),
	},
})

// Step 2: Generate an authorization URL
const { authUrl } = auth.getAuthorizationUrl()
// Redirect user to authUrl

// Step 3: Exchange authorization code for tokens
// This happens in your redirect handler
const tokens = await auth.exchangeCode('authorization-code')

// Step 4: Create the API client
const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth,
})
```

### Static Token Authentication

For scripts or applications that already have an access token:

```typescript
import { createSchwabAuth, AuthStrategy, createApiClient } from 'schwab-api'

// Create an auth client with a static token
const auth = createSchwabAuth({
	strategy: AuthStrategy.STATIC,
	accessToken: 'your-access-token',
})

// Create the API client
const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth,
})
```

### Custom Token Management

For advanced use cases where you need complete control over token management:

```typescript
import {
	createSchwabAuth,
	AuthStrategy,
	createApiClient,
	type ITokenLifecycleManager,
} from 'schwab-api'

// Implement your custom token manager
class MyCustomTokenManager implements ITokenLifecycleManager {
	// Implement required methods
	async getTokenData() {
		/* ... */
	}
	async getAccessToken() {
		/* ... */
	}
	supportsRefresh() {
		/* ... */
	}
	async refreshIfNeeded() {
		/* ... */
	}
	onRefresh() {
		/* ... */
	}
}

// Create your custom token manager
const myTokenManager = new MyCustomTokenManager()

// Create an auth client with your custom token manager
const auth = createSchwabAuth({
	strategy: AuthStrategy.CUSTOM,
	tokenManager: myTokenManager,
})

// Create the API client
const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth,
})
```

### Direct Integration with `createApiClient()`

For backward compatibility, you can also pass auth configuration directly to
`createApiClient()`:

```typescript
import { createApiClient, AuthStrategy } from 'schwab-api'

// Create an API client with integrated auth configuration
const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth: {
		strategy: AuthStrategy.CODE_FLOW,
		oauthConfig: {
			clientId: 'your-client-id',
			clientSecret: 'your-client-secret',
			redirectUri: 'your-redirect-uri',
		},
	},
})
```

## Token Management Architecture

The authentication system is built around a few key interfaces and components:

1. **ITokenLifecycleManager**: The core interface for token management.
2. **AuthStrategy**: Enum defining supported authentication strategies.
3. **BaseTokenHandler**: Core implementation of token exchange, refresh, and
   storage operations that implements ITokenLifecycleManager.
4. **OAuthTokenManager**: Implementation for OAuth flow authentication that
   extends BaseTokenHandler.
5. **StaticTokenManager**: Implementation for static token authentication.
6. **ConcurrentTokenManager**: Internal wrapper that adds concurrency protection
   for token refresh operations automatically.
7. **forceRefreshTokens** and **getCurrentAccessToken**: Utility functions for
   direct token operations.

All authentication methods ultimately implement the `ITokenLifecycleManager`
interface, providing a consistent way to retrieve and refresh tokens regardless
of the underlying authentication mechanism. The library ensures that any token
manager that supports refresh automatically gets concurrency protection.

## Token Refresh Handling

The library automatically handles token refresh when tokens are about to expire:

1. When a token is about to expire (within 5 minutes by default), it will be
   automatically refreshed when making API calls using the `tokenIsExpiringSoon`
   utility.
2. Concurrent requests will share the same refresh operation to prevent race
   conditions through the `ConcurrentTokenManager`.
3. Refresh tokens expire after 7 days of inactivity, at which point
   re-authentication is required.
4. The library provides a consistent way to check for expiring tokens through
   the unified `tokenIsExpiringSoon` function.

Example handling for expired refresh tokens:

```typescript
try {
	const data = await client.marketData.quotes.getQuotes(['AAPL', 'MSFT'])
} catch (error) {
	// Check for token expiration
	if (error instanceof SchwabAuthError && error.code === 'TOKEN_EXPIRED') {
		// Redirect user to re-authenticate
		const { authUrl } = auth.getAuthorizationUrl()
		window.location.href = authUrl
	} else {
		// Handle other errors
		console.error('API call failed:', error)
	}
}
```
