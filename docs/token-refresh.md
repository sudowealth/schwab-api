# Token Refresh and Concurrency Protection

## Overview

The Schwab API requires OAuth authentication, which means dealing with access
tokens that expire periodically. This document explains how the API client
provides robust token refresh with concurrency protection using the
`TokenManager` class.

## Understanding Token Refresh Challenges

When using OAuth tokens in applications that make concurrent API requests, you
may encounter a race condition:

1. Multiple requests detect an expired token simultaneously
2. Each initiates a refresh operation
3. This can lead to:
   - Multiple unnecessary calls to the refresh endpoint
   - Potential rate limiting from the OAuth server
   - Potential token inconsistency issues

## Solution: Automatic Concurrency Protection

The Schwab API client automatically provides concurrency-safe token refresh by
internally wrapping refresh-capable token managers with concurrency protection.
This ensures that only one refresh operation happens at a time, even when
multiple requests detect an expired token simultaneously.

## How It Works

1. **Automatic Wrapping**: When you provide an `ITokenLifecycleManager` to
   `createApiClient` that supports refresh, it's automatically wrapped with
   `ConcurrentTokenManager`
2. **Mutex Lock**: Uses an internal mutex to ensure only one refresh operation
   runs at a time
3. **Request Batching**: If multiple requests need a refresh, only one refresh
   operation is performed, and all requests receive the same refreshed token
4. **Promise Sharing**: Uses a shared promise to ensure consistency across
   concurrent calls

## Implementation Example

```typescript
import {
	type ITokenLifecycleManager,
	type TokenData,
} from '@sudowealth/schwab-api'

// Create a token manager that implements ITokenLifecycleManager
const myTokenManager: ITokenLifecycleManager = {
	async getTokenData(): Promise<TokenData | null> {
		// Get tokens from secure storage
		return {
			accessToken: 'current-access-token',
			refreshToken: 'current-refresh-token',
			expiresAt: Date.now() + 60 * 60 * 1000, // Example expiry time
		}
	},

	async getAccessToken(): Promise<string | null> {
		const data = await this.getTokenData()
		return data?.accessToken || null
	},

	supportsRefresh(): boolean {
		return true
	},

	async refreshIfNeeded(): Promise<TokenData> {
		// Call your API to refresh tokens using the current refresh token
		const response = await fetch('https://api.example.com/oauth/token', {
			method: 'POST',
			body: JSON.stringify({
				grant_type: 'refresh_token',
				refresh_token: 'current-refresh-token',
			}),
		})

		const data = await response.json()

		// Save the new tokens to secure storage

		return {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresAt: Date.now() + data.expires_in * 1000,
		}
	},

	onRefresh(callback: (tokenData: TokenData) => void): void {
		// Register callback to be notified when tokens are refreshed
		// This could be used to update UI, log events, or sync tokens
	},
}

// Use your token manager directly with the API client
// Concurrency protection is added automatically
const client = createApiClient({
	token: myTokenManager,
	// ...other options
})
```

## Simplified Token Refresh Methods

For more direct control over token refresh operations, you can use the utility
functions provided:

```typescript
import {
	forceRefreshTokens,
	getCurrentAccessToken,
} from '@sudowealth/schwab-api'

// Force refresh tokens regardless of expiration time
const refreshedTokens = await forceRefreshTokens(myTokenManager)

// Get the current access token, automatically refreshing if needed
const accessToken = await getCurrentAccessToken(myTokenManager, {
	// Optionally customize the refresh threshold (default is 5 minutes)
	refreshThresholdMs: 10 * 60 * 1000, // 10 minutes
})
```

The library always ensures concurrency protection internally so you don't need
to manage it manually.

## When Concurrency Protection Is Important

Concurrency protection is particularly valuable when:

1. Your application makes concurrent API requests
2. You're building multi-user applications with shared authentication
3. You want to reduce the number of refresh calls to the OAuth server

For single-threaded scripts or applications with very low request volume, the
protection still provides value but may not be as critical.

## Implementation Details

- The `withTokenAuth` middleware checks if tokens are about to expire and
  initiates a refresh when needed
- When a refresh is needed, the concurrency protection ensures only one refresh
  happens at a time
- All requests waiting for a refresh will receive the same new token
- If a refresh fails, the error is propagated to all waiting requests

## Best Practices

1. **Token Storage**: Store tokens securely (not in localStorage for production
   applications)
2. **Error Handling**: Implement proper error handling for refresh failures
3. **Refresh Windows**: The default refresh window is 5 minutes before expiry,
   which can be adjusted if needed
4. **Logging**: Enable logging (`enableLogging: true`) during development to see
   token refresh operations
