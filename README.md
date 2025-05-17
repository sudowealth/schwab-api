# Schwab API Client

A TypeScript client for interacting with the Charles Schwab API, including
market data (quotes, instruments, options) and trader endpoints (accounts,
orders, transactions).

## ⚠️ Unofficial Library ⚠️

**This is an unofficial, community-developed TypeScript client library for
interacting with Schwab APIs. It has not been approved, endorsed, or certified
by Charles Schwab. It is provided as-is, and its functionality may be incomplete
or unstable. Use at your own risk, especially when dealing with financial data
or transactions.**

## Table of Contents

- [Key Features](#key-features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Examples](#usage)
  - [Full OAuth Flow with Simplified Token Management](#example-1-full-oauth-flow-with-simplified-token-management)
  - [OAuth Flow with Enhanced Token Management](#example-1a-full-oauth-flow-with-enhanced-token-management)
  - [Using a Static Token](#example-2-using-a-static-token)
  - [Custom Token Manager](#example-3-custom-token-manager)
- [API Coverage](#api-coverage)
  - [Market Data](#market-data)
  - [Trading](#trading)
- [Making API Calls](#making-api-calls)
- [Unified Discovery with the `all` Namespace](#unified-discovery-with-the-all-namespace)
- [Important Notes](#important-notes)
  - [Token Persistence](#token-persistence)
  - [Refresh Token Expiration](#refresh-token-expiration)
- [Error Handling](#error-handling)
  - [Handling Partial Success in Quote Endpoints](#handling-partial-success-in-quote-endpoints)
- [Advanced Configuration](#advanced-configuration)
  - [Customizing Middleware](#customizing-middleware)
- [API Reference](#api-reference)
- [Documentation](#documentation)
- [Development](#development)
- [License](#license)

## Key Features

- **OAuth Helper**: Client-credentials OAuth flow with automatic token handling
- **Request Pipeline**: Middleware system for auth, rate limits, and retries
- **Type Safety**: Complete TypeScript definitions for all API endpoints
- **Zod Validation**: Runtime schema validation for API responses
- **Concurrency Protection**: Thread-safe token refresh for high-volume
  applications
- **Comprehensive Error Handling**: Detailed error types with rich debugging
  context

## Installation

```bash
npm install schwab-api
# or
yarn add schwab-api
# or
pnpm add schwab-api
```

**Compatibility**: Tested with Node.js 16+ and TypeScript 4.5+.

## Quick Start

```typescript
import { createApiClient } from 'schwab-api'

// Create API client with a static token
const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth: 'YOUR_ACCESS_TOKEN', // Simple string token for quick start
})

async function main() {
	try {
		// Get market quotes for multiple symbols
		// Note: The token is handled internally by the client via middleware
		const quotesResponse = await client.marketData.quotes.getQuotes({
			queryParams: { symbols: ['AAPL', 'MSFT', 'GOOG'] },
		})
		console.log('Quotes:', quotesResponse)
	} catch (error) {
		// See Error Handling section for more details
		if (client.errors.isSchwabApiError(error)) {
			console.error('API Error:', error.message)
		} else {
			console.error('Unexpected error:', error)
		}
	}
}

main()
```

## Usage

The Schwab API client offers a unified way to configure authentication based on
your specific needs.

### Recommended Approach: Using createSchwabAuth

The recommended way to authenticate is using the `createSchwabAuth()` function
which provides a consistent interface for all authentication strategies:

```typescript
import { createSchwabAuth, AuthStrategy, createApiClient } from 'schwab-api'

// Create an auth client with your preferred strategy
const auth = createSchwabAuth({
	strategy: AuthStrategy.CODE_FLOW, // Or AuthStrategy.STATIC or AuthStrategy.CUSTOM
	oauthConfig: {
		clientId: process.env.SCHWAB_CLIENT_ID,
		clientSecret: process.env.SCHWAB_CLIENT_SECRET,
		redirectUri: 'https://example.com/callback',
		// Optional storage callbacks
		save: async (tokens) => {
			await fs.writeFile('tokens.json', JSON.stringify(tokens), 'utf8')
		},
		load: async () => {
			try {
				const data = await fs.readFile('tokens.json', 'utf8')
				return JSON.parse(data)
			} catch (err) {
				return null
			}
		},
	},
})

// Generate login URL for user auth
console.log('Visit:', auth.getAuthorizationUrl().authUrl)

// Exchange authorization code for tokens
const tokens = await auth.exchangeCode('<authorization-code>')

// Create API client with the auth client
const client = createApiClient({
	config: { environment: 'PRODUCTION' },
	auth, // Pass the auth client
})

// Make API calls
const accounts = await client.trader.accounts.getAccounts()
```

### Example 1: OAuth Code Flow Authentication

For web applications that need to authenticate users:

```typescript
import { createSchwabAuth, AuthStrategy, createApiClient } from 'schwab-api'

// Create an auth client with OAuth configuration
const auth = createSchwabAuth({
	strategy: AuthStrategy.CODE_FLOW,
	oauthConfig: {
		clientId: process.env.SCHWAB_CLIENT_ID,
		clientSecret: process.env.SCHWAB_CLIENT_SECRET,
		redirectUri: 'https://example.com/callback',
		save: async (tokens) => storeTokensSecurely(tokens),
		load: async () => retrieveTokensFromStorage(),
	},
})

// Generate authorization URL for login
console.log('Visit:', auth.getAuthorizationUrl().authUrl)

// Exchange authorization code for tokens (after user login)
const tokens = await auth.exchangeCode('<authorization-code>')

// Create API client with auth
const client = createApiClient({
	config: { environment: 'PRODUCTION' },
	auth,
})

// Make API calls - token refresh is handled automatically
const accounts = await client.trader.accounts.getAccounts()
```

### Example 2: Using a Static Token

For scripts or applications that already have an access token:

```typescript
import { createSchwabAuth, AuthStrategy, createApiClient } from 'schwab-api'

// Method 1: Using createSchwabAuth
const auth = createSchwabAuth({
	strategy: AuthStrategy.STATIC,
	accessToken: 'your-access-token-here',
})

// Create client with auth object
const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth,
})

// Method 2: Direct integration with createApiClient
const clientAlt = createApiClient({
	config: { environment: 'SANDBOX' },
	auth: 'your-access-token-here', // Pass token string directly
})

// Make API calls
const quotes = await client.marketData.quotes.getQuotes({
	queryParams: { symbols: ['AAPL', 'MSFT', 'GOOG'] },
})
```

### Example 3: Custom Token Manager

For advanced scenarios with custom token management:

```typescript
import {
	createSchwabAuth,
	AuthStrategy,
	createApiClient,
	ITokenLifecycleManager,
} from 'schwab-api'

// Create a custom token manager
class CustomTokenManager implements ITokenLifecycleManager {
	constructor(private backendUrl: string) {}

	async getTokenData() {
		const response = await fetch(`${this.backendUrl}/api/token`)
		const data = await response.json()
		return {
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			expiresAt: data.expiresAt,
		}
	}

	async getAccessToken() {
		const tokenData = await this.getTokenData()
		return tokenData?.accessToken || null
	}

	supportsRefresh() {
		return true
	}

	async refreshIfNeeded() {
		const response = await fetch(`${this.backendUrl}/api/refresh`, {
			method: 'POST',
		})
		const data = await response.json()
		return {
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			expiresAt: data.expiresAt,
		}
	}

	onRefresh(callback) {
		// Implement callback registration if needed
	}
}

// Method 1: Using createSchwabAuth
const auth = createSchwabAuth({
	strategy: AuthStrategy.CUSTOM,
	tokenManager: new CustomTokenManager('https://your-backend.com'),
})

// Create client with auth
const client = createApiClient({
	config: { environment: 'PRODUCTION' },
	auth,
})

// Method 2: Direct integration
const clientAlt = createApiClient({
	config: { environment: 'PRODUCTION' },
	auth: new CustomTokenManager('https://your-backend.com'),
})

// Make API calls
const accounts = await client.trader.accounts.getAccounts()
```

### Direct Integration with createApiClient

You can also pass auth configuration directly to createApiClient for more
concise code:

```typescript
import { createApiClient, AuthStrategy } from 'schwab-api'

// Pass auth configuration directly to createApiClient
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

// For static tokens
const staticClient = createApiClient({
	config: { environment: 'SANDBOX' },
	auth: 'your-access-token', // Just pass the token string
})
```

## API Coverage

The Schwab API client provides comprehensive access to all major API endpoints.
Each method corresponds to a specific Schwab API endpoint with appropriate
typing and schema validation.

### Market Data

- **Quotes**: Real-time and delayed quotes for securities
  ```typescript
  // Maps to GET /v1/marketdata/quotes
  const quotes = await client.marketData.quotes.getQuotes({
  	queryParams: { symbols: ['AAPL', 'MSFT', 'GOOG'] },
  })
  ```
- **Instruments**: Lookup information about financial instruments
  ```typescript
  // Maps to GET /v1/marketdata/instruments
  const instrument = await client.marketData.instruments.searchInstruments({
  	queryParams: {
  		symbol: 'AAPL',
  		projection: 'fundamental', // Options: 'symbol-search', 'symbol-regex', 'desc-search', 'desc-regex', 'fundamental'
  	},
  })
  ```
- **Price History**: Historical price data with customizable periods

  ```typescript
  // Maps to GET /v1/marketdata/{symbol}/pricehistory
  const history = await client.marketData.priceHistory.getPriceHistory({
  	symbol: 'AAPL', // Path parameter for the API endpoint
  	queryParams: {
  		periodType: 'day', // Options: 'day', 'month', 'year', 'ytd'
  		period: 10, // Number of periods
  		frequencyType: 'minute', // Options: 'minute', 'daily', 'weekly', 'monthly'
  		frequency: 5, // Frequency of candles
  	},
  })
  ```

- **Options**: Options chain data and analytics
  ```typescript
  // Maps to GET /v1/marketdata/chains
  const options = await client.marketData.options.getOptionChain({
  	queryParams: {
  		symbol: 'AAPL',
  		strikeCount: 3, // Number of strikes above and below ATM
  		includeQuotes: true, // Include underlying quote data
  		// Other available parameters:
  		// strategy: 'SINGLE',   // Options: 'SINGLE', 'ANALYTICAL', 'COVERED', 'VERTICAL', etc.
  		// range: 'ITM',        // Options: 'ITM', 'OTM', 'ATM', etc.
  	},
  })
  ```
- **Movers**: Market movers by index and movement type
  ```typescript
  // Maps to GET /v1/marketdata/{index}/movers
  const movers = await client.marketData.movers.getMovers({
  	index: '$SPX.X', // Path parameter: '$SPX.X', '$DJI', '$COMPX', etc.
  	queryParams: {
  		direction: 'up', // Options: 'up', 'down', 'up_and_down'
  		change: 'percent', // Options: 'percent', 'value'
  	},
  })
  ```
- **Market Hours**: Trading hours for markets and products
  ```typescript
  // Maps to GET /v1/marketdata/hours
  const hours = await client.marketData.marketHours.getMarketHours({
  	queryParams: {
  		markets: ['EQUITY', 'OPTION'], // Options: 'EQUITY', 'OPTION', 'FUTURE', 'BOND', 'FOREX'
  		date: '2023-09-01', // Format: YYYY-MM-DD
  	},
  })
  ```

### Trading

- **Accounts**: Account information and balances

  ```typescript
  // Maps to GET /v1/accounts
  const accounts = await client.trader.accounts.getAccounts()

  // Maps to GET /v1/accounts/{accountId}
  const specificAccount = await client.trader.accounts.getAccount({
  	accountId: 'YOUR_ACCOUNT_ID', // Path parameter for the API endpoint
  })
  ```

- **Orders**: Order placement, modification, and retrieval

  ```typescript
  // Maps to GET /v1/accounts/{accountId}/orders
  const orders = await client.trader.orders.getOrders({
  	accountId: 'YOUR_ACCOUNT_ID', // Path parameter
  	queryParams: {
  		// Optional parameters for filtering orders
  		// fromEnteredTime: '2023-01-01',
  		// toEnteredTime: '2023-09-01',
  		// status: 'FILLED'        // Options: 'AWAITING_PARENT_ORDER', 'AWAITING_CONDITION', 'AWAITING_MANUAL_REVIEW', etc.
  	},
  })

  // Maps to POST /v1/accounts/{accountId}/orders
  const orderResult = await client.trader.orders.placeOrder({
  	accountId: 'YOUR_ACCOUNT_ID', // Path parameter
  	body: {
  		// Schema follows Schwab API order specification
  		orderType: 'LIMIT', // Options: 'MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', etc.
  		session: 'NORMAL', // Options: 'NORMAL', 'AM', 'PM', 'SEAMLESS'
  		price: 150.0, // Required for LIMIT orders
  		duration: 'DAY', // Options: 'DAY', 'GOOD_TILL_CANCEL', 'FILL_OR_KILL'
  		orderStrategyType: 'SINGLE', // Options: 'SINGLE', 'OCO', 'TRIGGER'
  		orderLegCollection: [
  			{
  				instruction: 'BUY', // Options: 'BUY', 'SELL', 'BUY_TO_COVER', 'SELL_SHORT', etc.
  				quantity: 1,
  				instrument: {
  					symbol: 'AAPL',
  					assetType: 'EQUITY', // Options: 'EQUITY', 'OPTION', 'INDEX', 'MUTUAL_FUND', etc.
  				},
  			},
  		],
  	},
  })
  ```

- **Transactions**: Historical transaction information
  ```typescript
  // Maps to GET /v1/accounts/{accountId}/transactions
  const transactions = await client.trader.transactions.getTransactions({
  	accountId: 'YOUR_ACCOUNT_ID', // Path parameter
  	queryParams: {
  		type: 'ALL', // Options: 'ALL', 'TRADE', 'DIVIDEND', 'INTEREST', etc.
  		startDate: '2023-01-01', // Format: YYYY-MM-DD
  		endDate: '2023-09-01', // Format: YYYY-MM-DD
  	},
  })
  ```
- **User Preferences**: User preference settings
  ```typescript
  // Maps to GET /v1/accounts/{accountId}/preferences
  const preferences = await client.trader.userPreference.getUserPreferences({
  	accountId: 'YOUR_ACCOUNT_ID', // Path parameter
  })
  ```

## Making API Calls

Once you have a configured client, you can use it to access all API endpoints.
The authentication token is automatically handled by the middleware pipeline:

```typescript
try {
	// Get account information
	const accounts = await client.trader.accounts.getAccounts()
	console.log('Accounts:', accounts)

	// Get market quotes
	const quotes = await client.marketData.quotes.getQuotes({
		queryParams: {
			symbols: ['AAPL', 'MSFT', 'GOOG'],
		},
	})
	console.log('Quotes:', quotes)

	// Get orders for an account
	if (accounts.length > 0) {
		const firstAccountHash = accounts[0].securitiesAccount.hashedAccountId
		const orders = await client.trader.orders.getOrders({
			accountId: firstAccountHash,
		})
		console.log(`Orders for account ${firstAccountHash}:`, orders)
	}
} catch (error) {
	// Error handling - see Error Handling section for details
	if (client.errors.isSchwabApiError(error)) {
		console.error('API Error:', error.message, error.status)
	} else if (client.errors.isSchwabAuthError(error)) {
		console.error('Auth Error:', error.message, error.code)
	} else {
		console.error('Unexpected error:', error)
	}
}
```

### Unified Discovery with the `all` Namespace

The client provides a unified discovery approach through the `all` namespace,
giving you access to everything in one place without needing additional imports:

```typescript
import { createApiClient } from 'schwab-api'

const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth: 'YOUR_ACCESS_TOKEN',
})

// Use traditional namespaces
const quotes = await client.marketData.quotes.getQuotes({
	queryParams: { symbols: ['AAPL', 'MSFT'] },
})

// Or use the comprehensive 'all' namespace for discoverability
// This gives you access to ALL error types, utilities, and helpers
const isRetryable = client.all.errors.isRetryableError(error)
const errorCategory = client.all.errors.getErrorCategory(error)

// You can also use it to access any part of the API
const marketHours = await client.all.marketData.marketHours.getMarketHours({
	queryParams: {
		markets: ['EQUITY'],
		date: '2023-09-01',
	},
})

// The 'all' namespace provides complete type discoverability
// You'll see all available methods, types, and utilities in your IDE
```

The `all` namespace eliminates the need for additional imports when you want to
access specialized utilities or types, making it easier to discover and use the
full API surface.

## Important Notes

### Token Persistence

The `save` and `load` functions provided to `createSchwabAuthClient` allow you
to persist tokens between application restarts:

1. **save(tokens)**: Called automatically whenever:

   - New tokens are obtained via `exchangeCodeForTokens()`
   - Tokens are refreshed via `refreshTokens()`

2. **load()**: Called automatically when:
   - `refreshTokens()` is invoked and there's no in-memory token
   - Used to retrieve previously saved tokens for refresh operations

This persistence mechanism prevents users from having to re-authenticate every
time your application restarts, as long as the refresh token hasn't expired.

In production applications, you should use a secure storage mechanism
appropriate for your platform (e.g., encrypted storage, secure key vault, etc.).

### Refresh Token Expiration

**Important**: Schwab refresh tokens have a hard 7-day expiration limit that
**cannot be extended**. This is a security measure **enforced by Schwab's API
servers**, not a limitation of this library.

When a refresh token expires:

- The refresh operation will throw a `SchwabAuthError` with code `TOKEN_EXPIRED`
- The user must complete a full re-authentication flow through Schwab's login
  page
- There is no way to refresh tokens indefinitely without user interaction

#### Handling Token Expiration

Your application must be designed to handle the 7-day refresh token expiration.
Here are recommended strategies:

1. **Proactively Check Expiration**:

   ```typescript
   if (auth.isRefreshTokenNearingExpiration()) {
   	// Show a message to the user that they will need to re-authenticate soon
   	showReauthenticationPrompt(
   		'Your Schwab session will expire soon. Please re-authenticate to maintain uninterrupted access.',
   	)
   }
   ```

2. **Gracefully Handle Expiration Errors**:

   ```typescript
   try {
   	await client.trader.accounts.getAccounts()
   } catch (error) {
   	if (
   		client.errors.isSchwabAuthError(error) &&
   		error.code === 'TOKEN_EXPIRED'
   	) {
   		// Inform the user that their session has expired
   		showLoginPrompt(
   			'Your Schwab session has expired. Please log in again to continue.',
   		)
   		// Redirect to auth flow
   		window.location.href = auth.getAuthorizationUrl().authUrl
   	}
   }
   ```

3. **Plan Your Application UX**:
   - Design your application with the understanding that users will need to
     re-authenticate weekly
   - Consider scheduling non-critical operations to avoid interrupting important
     workflows
   - Store user preferences and application state independently from
     authentication state

**Best Practice**: Include clear messaging in your application about the 7-day
session limit so users understand this is a security feature of Schwab's API,
not a limitation of your application.

## Error Handling

The Schwab API client provides a comprehensive error handling system with rich
debugging context and consistent error types.

```typescript
try {
	await client.trader.accounts.getAccounts()
} catch (error) {
	// Use type guards to identify error types
	if (client.errors.isSchwabAuthError(error)) {
		if (error.code === 'TOKEN_EXPIRED') {
			// Refresh token has expired (after 7 days)
			// Must re-authenticate via authorization flow
			console.error('Auth token expired, user must re-authenticate')
		} else {
			console.error('Auth Error:', error.message, error.code)
		}
	} else if (client.errors.isSchwabApiError(error)) {
		// Get debugging context for API errors
		console.error(`API Error: ${error.message}`)
		console.error(`Status: ${error.status}`)
		console.error(`Request ID: ${error.getRequestId()}`)
		console.error(`Debug Context: ${error.getDebugContext()}`)
	} else if (client.errors.isSchwabRateLimitError(error)) {
		// Handle rate limit errors specially
		console.error(`Rate limit exceeded. Retry after: ${error.retryAfterMs}ms`)
		// Optionally implement backoff logic
	} else {
		// Handle unexpected errors
		console.error('Unexpected error:', error)
	}
}
```

### Handling Partial Success in Quote Endpoints

**Note**: This partial success pattern is specific to the quotes endpoints and
does not apply to other endpoints.

The quotes endpoints are unique in that they can return a successful HTTP 200
response that contains a mix of valid quotes and individual symbol errors. This
"partial success" pattern is different from standard errors that would throw a
`SchwabApiError`.

```typescript
// Get quotes for multiple symbols
const response = await client.marketData.quotes.getQuotes({
	queryParams: {
		symbols: ['AAPL', 'MSFT', 'INVALID', 'XYZ123'],
	},
})

// Check for symbol-level errors
const errorInfo = client.marketData.quotes.extractQuoteErrors(response)

if (errorInfo.hasErrors) {
	console.log(`Found ${errorInfo.errorCount} symbol errors:`)

	// List the invalid symbols
	console.log('Invalid symbols:', errorInfo.invalidSymbols)

	// Access individual symbol errors
	for (const [symbol, errorData] of Object.entries(errorInfo.symbolErrors)) {
		console.log(`Error for ${symbol}:`, errorData.description)
	}

	// Continue processing valid quotes
	for (const [symbol, data] of Object.entries(response)) {
		if (!client.marketData.quotes.hasSymbolError(response, symbol)) {
			console.log(`Quote for ${symbol}:`, data.mark || data.lastPrice)
		}
	}
}
```

This approach allows your application to gracefully handle partial failures
while still processing valid data.

For more details on error handling, see
[Error Handling and Debugging](./docs/error-handling.md).

## Advanced Configuration

### Creating API Endpoints

The Schwab API client provides a unified approach for creating API endpoints
across different domains. Instead of each domain module creating its own
`RequestContext`, endpoints can use the shared context from the API client. This
ensures that all endpoints benefit from the same middleware pipeline and
configuration.

#### For API Client Users

When using the API client, all endpoints are already configured and ready to
use:

```typescript
// Create API client with default configuration
const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth: 'your-access-token',
})

// Use pre-configured endpoints
const quotes = await client.marketData.quotes.getQuotes({
	queryParams: { symbols: ['AAPL', 'MSFT'] },
})
```

#### For Contributors and Custom Endpoint Creation

If you're creating custom endpoints or contributing to the library, use the
shared context and createEndpointWithContext function:

```typescript
import { getSharedContext } from '../core/shared-context'
import { createEndpointWithContext } from '../core/http'
import { ErrorResponseSchema } from '../errors'

// Create an endpoint using the shared context
export const getCustomData = createEndpointWithContext<
	PathParamsType,
	QueryParamsType,
	BodyType,
	ResponseType,
	'GET',
	ErrorResponseSchema
>(getSharedContext(), {
	method: 'GET',
	path: '/v1/custom/endpoint',
	pathSchema: PathParamsSchema,
	querySchema: QueryParamsSchema,
	responseSchema: ResponseSchema,
	errorSchema: ErrorResponseSchema,
	description: 'Description of the endpoint',
})
```

This approach ensures that all endpoints use the same configuration, middleware,
and error handling.

### Customizing Middleware

The Schwab API client uses a middleware pipeline for request processing. By
default, `createApiClient` sets up a standard pipeline with token
authentication, rate limiting, and retry functionality.

You can customize this pipeline to add your own middleware or modify the default
ones:

```typescript
import {
	createApiClient,
	withTokenAuth,
	withRateLimit,
	withRetry,
	compose,
} from 'schwab-api'

// Define custom logging middleware
const withLogging = (next) => async (request) => {
	console.log(`Making request to ${request.url}`)
	const startTime = Date.now()

	try {
		const response = await next(request)
		const duration = Date.now() - startTime
		console.log(`Request to ${request.url} completed in ${duration}ms`)
		return response
	} catch (error) {
		console.error(`Request to ${request.url} failed:`, error)
		throw error
	}
}

// Create client with custom middleware pipeline
const client = createApiClient({
	token: tokenManager,
	config: { environment: 'PRODUCTION' },
	// Override the default middleware pipeline with your own
	middleware: compose(
		withTokenAuth(tokenManager), // Add auth headers
		withLogging, // Add your custom middleware
		withRateLimit(5, 1000), // Max 5 requests per second
		withRetry({ max: 3, baseMs: 1000 }), // Retry failed requests
	),
})
```

**Important**: When you provide a custom middleware pipeline, you are
responsible for including all necessary middleware components. The default
middleware is not automatically applied in this case.

## API Reference

### Import Patterns

The Schwab API client provides a single, consistent entry point through the
`createApiClient` function. This is the recommended way to access all
functionality:

```typescript
import { createApiClient } from 'schwab-api'

// Create your API client
const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth: 'YOUR_ACCESS_TOKEN',
})

// Access API endpoints through namespaces
const quotes = await client.marketData.quotes.getQuotes({
	queryParams: { symbols: ['AAPL', 'MSFT'] },
})
```

Direct imports from submodules are no longer recommended. For more details on
import patterns, see [Import Patterns](./docs/import-patterns.md).

### Public API Surface

The Schwab API client provides a clear distinction between its public API
surface (what most developers need) and internal implementation details. The
following sections document the public API that is stable and recommended for
use.

### Authentication

- `createSchwabAuth(config)`: Unified authentication factory (recommended)

  - `config.strategy`: Specify authentication strategy
    (`AuthStrategy.CODE_FLOW`, `AuthStrategy.STATIC`, or `AuthStrategy.CUSTOM`)
  - `config.accessToken`: Required for STATIC strategy
  - `config.tokenManager`: Required for CUSTOM strategy
  - `config.oauthConfig`: Required for CODE_FLOW strategy

- `createSchwabAuthClient(options)`: Original OAuth client (still supported)
  - `auth.getAuthorizationUrl()`: Generate auth URL
  - `auth.exchangeCode(code)`: Exchange code for tokens
  - `auth.refresh(refreshToken)`: Refresh access token
  - `auth.onRefresh(callback)`: Register refresh callback
  - `auth.isRefreshTokenNearingExpiration()`: Check if refresh token is near
    expiration

### API Client Creation

- `createApiClient(options)`: Create a configured API client with all namespaces
  - `options.config`: Override default configuration
  - `options.auth`: Authentication configuration (recommended)
    - Can be a string access token, an object implementing
      ITokenLifecycleManager, or an AuthFactoryConfig
    - String tokens are automatically wrapped with StaticTokenManager
  - `options.middleware`: Configure middleware pipeline including rate limits,
    retries, and additional custom middleware

### Token Management

- `buildTokenManager(input, options)`: Unified function to create a token
  manager from various inputs
  - Automatically handles static tokens, existing token managers, and adds
    concurrency protection
  - Recommended approach for all token management needs
- `ITokenLifecycleManager`: Interface for token lifecycle management
- `StaticTokenManager`: Simple implementation for static tokens
- `ConcurrentTokenManager`: Wrapper that ensures only one refresh happens at a
  time

#### Public Token Utility Functions

- `isTokenLifecycleManager(obj)`: Type guard to check if an object implements
  the token manager interface
- `createStaticTokenManager(accessToken)`: Create a non-refreshable token
  manager

### Public Middleware Components

The library exposes key middleware components that can be used to customize the
request pipeline:

- `withTokenAuth(tokenManager)`: Add auth headers and auto-refresh
- `withRateLimit(options)`: Add rate limiting (enabled by default)
- `withRetry(options)`: Add retry with exponential backoff (enabled by default)
- `compose(...middleware)`: Utility to compose multiple middleware functions

#### Middleware Types

- `Middleware`: Type definition for middleware functions
- `TokenAuthOptions`: Configuration options for token auth middleware
- `RateLimitOptions`: Configuration options for rate limiting middleware
- `RetryOptions`: Configuration options for retry middleware

### Internal Implementation Details

The library now maintains a clear separation between public APIs and internal
implementation details. Internal utilities and helper functions are not exported
from the main module, which:

1. Reduces the public API surface
2. Makes it clearer which parts of the API are stable and supported
3. Allows for more flexibility in refactoring internal components
4. Prevents users from accidentally depending on implementation details

This modular architecture ensures that your code will continue to work with
future updates, as long as you rely only on the documented public API.

## Documentation

The Schwab API client includes detailed documentation to help you understand and
use its features:

- [Error Handling and Debugging](./docs/error-handling.md): Comprehensive error
  handling system with rich debugging context
- [Middleware Integration](./docs/middleware.md): How to use and customize the
  middleware pipeline
- [Token Architecture](./docs/token-architecture.md): Understanding the token
  management system
- [Token Refresh](./docs/token-refresh.md): How token refresh works and handling
  edge cases
- [Default Features](./docs/default-features.md): Built-in features enabled by
  default

## Development

- Clone the repository.
- Install dependencies: `npm install`
- Build: `npm run build`
- Test: `npm run test`

### Installing Beta Versions

To install the latest beta release:

```bash
npm install schwab-api@beta
```

### Publishing Beta Releases

This project uses semantic-release for automated versioning and publishing.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for instructions on publishing beta
releases with semantic-release.

## License

MIT
