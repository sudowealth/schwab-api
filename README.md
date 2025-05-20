# Schwab API Client

A TypeScript client for interacting with the Charles Schwab API, including
market data (quotes, instruments, options) and trader endpoints (accounts,
orders, transactions).

## Unofficial Library

**This is an unofficial, community-developed TypeScript client library for
interacting with Schwab APIs. It has not been approved, endorsed, or certified
by Charles Schwab. It is provided as-is, and its functionality may be incomplete
or unstable. Use at your own risk, especially when dealing with financial data
or transactions.**

## Table of Contents

- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
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

## Architecture Overview

The Schwab API client has been refactored to provide a clear and modular
structure. The codebase is organized into distinct directories, each
corresponding to a specific domain of API functionality:

- **`/auth`**: Handles all OAuth 2.0 authentication logic, including token
  generation, refresh, and lifecycle management. This module ensures secure and
  reliable access to the Schwab API. It introduces `createSchwabAuth` for
  creating authentication clients and `buildTokenManager` for more granular
  control over token behavior, especially regarding concurrency.
- **`/core`**: Contains the foundational building blocks of the client, such as
  the API client itself (`createApiClient`), middleware pipeline
  (`buildMiddlewarePipeline`), error handling, and request/response processing
  utilities.
- **`/market-data`**: Provides access to market data endpoints, including:
  - `quotes`: Fetching real-time or delayed quotes for various symbols.
  - `price-history`: Retrieving historical price data.
  - `instruments`: Searching and retrieving instrument details.
  - `movers`: Getting market movers.
  - `options`: Accessing options chain data.
- **`/trader`**: Manages trading-related functionalities, such as:
  - `accounts`: Retrieving account information and balances.
  - `orders`: Placing, modifying, and canceling orders.
  - `transactions`: Fetching transaction history.

This modular design promotes better separation of concerns and makes it easier
to navigate and extend the library.

### Naming Conventions

- The `createSchwabAuth` function creates an authentication client.
- The `buildTokenManager` function is used internally by `createSchwabAuth` but
  can also be used directly to construct token managers, particularly when
  dealing with custom token storage or refresh logic that requires concurrency.

### Concurrency Protection

Token refresh operations are automatically protected against race conditions.
When you use `createSchwabAuth` with `AuthStrategy.ENHANCED`, the
`EnhancedTokenManager` provides built-in concurrency protection. This ensures
that multiple concurrent API calls will not trigger multiple simultaneous token
refresh attempts, preventing potential issues and ensuring a stable token
lifecycle.

You can access the various API domains through the client instance:

```typescript
import {
	createApiClient,
	createSchwabAuth,
	AuthStrategy,
} from '@sudowealth/schwab-api'

// Assuming auth is configured (see Quick Start or Usage Examples)
const auth = createSchwabAuth({
	/* ... your auth config ... */
})
const client = createApiClient({ auth })

// Access market data endpoints
const quotes = await client.all.marketData.quotes.getQuotes({
	queryParams: { symbols: ['AAPL'] },
})

// Access trader endpoints
const accounts = await client.all.trader.accounts.getAccounts()
```

## Installation

```bash
npm install schwab-api
# or
yarn add schwab-api
# or
pnpm add schwab-api
```

## Quick Start

> **Prerequisites**:
>
> 1. You must have a Schwab developer account. You can register at
>    @https://developer.schwab.com/register.
> 2. Create an application at @https://developer.schwab.com/dashboard/apps.
> 3. In your application settings, provide your callback URL.
> 4. Obtain the Client ID (App Key) and Client Secret from your application
>    page. These will be used as environment variables (e.g., `SCHWAB_CLIENT_ID`
>    and `SCHWAB_CLIENT_SECRET`).

The quickest way to get started is by using `createSchwabAuth` along with
`createApiClient`. This example demonstrates using a static access token. For
more robust authentication, such as OAuth 2.0 Code Flow, refer to the "Usage
Examples" section.

```typescript
// Minimal Hello World
import {
	createApiClient,
	createSchwabAuth,
	AuthStrategy,
} from '@sudowealth/schwab-api'
;(async () => {
	const auth = createSchwabAuth({
		strategy: AuthStrategy.ENHANCED,
		accessToken: 'YOUR_TOKEN',
	}) // Replace YOUR_TOKEN with a valid token
	const client = createApiClient({ auth, config: { environment: 'SANDBOX' } }) // For actual live data, set environment: 'PRODUCTION'. Ensure your OAuth credentials are also configured for production use in your Schwab developer dashboard.
	const quotes = await client.marketData.quotes.getQuotes({
		queryParams: { symbols: ['AAPL'] },
	})
	console.log(quotes)
})()
```

```typescript
import {
	createApiClient,
	createSchwabAuth,
	AuthStrategy,
} from '@sudowealth/schwab-api'

async function main() {
	// 1. Initialize Authentication
	// For this quick start, we'll use a static token.
	// Replace 'YOUR_ACCESS_TOKEN' with your actual token.
	const auth = createSchwabAuth({
		strategy: AuthStrategy.ENHANCED,
		accessToken: 'YOUR_ACCESS_TOKEN',
	})

	// Alternatively, for OAuth 2.0 Code Flow (more common for applications):
	// Make sure SCHWAB_CLIENT_ID and SCHWAB_CLIENT_SECRET are defined in your environment (e.g., in .env or your hosting platform's config).
	const auth = createSchwabAuth({
		strategy: AuthStrategy.ENHANCED,
		oauthConfig: {
			clientId: process.env.SCHWAB_CLIENT_ID!, // Ensure these are set in your environment
			clientSecret: process.env.SCHWAB_CLIENT_SECRET!,
			redirectUri: 'https://example.com/callback', // Must match your Schwab app config
			// Optional: Implement load/save for token persistence
			load: async () => {
				/* load TokenData from storage */ return null
			},
			save: async (tokenData) => {
				/* save TokenData to storage */
			},
		},
	})
	// For CODE_FLOW, you would then redirect the user to:
	const { authUrl } = auth.getAuthorizationUrl()
	// And after they authorize, exchange the code:
	const tokenData = await auth.exchangeCode('THE_CODE_FROM_REDIRECT')

	// Or, using a custom token manager:
	const customManager = {
		// Implement ITokenLifecycleManager
		async getAccessToken() {
			return 'custom_token'
		},
		async refreshIfNeeded() {
			return false
		}, // Or implement refresh logic
		supportsRefresh: () => false,
	}
	const auth = createSchwabAuth({
		strategy: AuthStrategy.ENHANCED,
		tokenManager: customManager,
	})

	// 2. Create API Client
	// The 'auth' object created above is passed directly.
	// Concurrency for token refresh is handled automatically if the auth strategy supports it.
	const client = createApiClient({
		config: { environment: 'SANDBOX' }, // Or 'PRODUCTION'. For actual live data, set environment: 'PRODUCTION'. Ensure your OAuth credentials are also configured for production use in your Schwab developer dashboard.
		auth,
	})

	try {
		// 3. Make API Calls
		// Example: Get market quotes for multiple symbols
		// The token is handled internally by the client.
		const quotesResponse = await client.marketData.quotes.getQuotes({
			queryParams: { symbols: ['AAPL', 'MSFT', 'GOOG'] },
		})
		console.log('Quotes:', JSON.stringify(quotesResponse, null, 2))

		// Example: Get account information (if your token has trader access)
		const accountsResponse = await client.trader.accounts.getAccounts()
		console.log('Accounts:', JSON.stringify(accountsResponse, null, 2))
	} catch (error) {
		// See Error Handling section for more details
		if (client.errors.isSchwabApiError(error)) {
			console.error('API Error:', error.message)
			console.error('HTTP Status:', error.status)
			console.error('Response Body:', JSON.stringify(error.body, null, 2))
			if (error.isRetryable && error.isRetryable()) {
				console.log(
					'This error might be retryable. You can safely retry this request.',
				)
			}
		} else {
			console.error('Unexpected error:', error)
		}
	}
}

main()
```

This example provides a basic structure. For more detailed examples, including
the full OAuth 2.0 flow and token persistence, please see the
[Usage Examples](#usage) section.

## Usage

The Schwab API client offers a unified way to configure authentication based on
your specific needs.

### Recommended Approach: Using createSchwabAuth

The recommended way to authenticate is using the `createSchwabAuth()` function
which provides a consistent interface for all authentication strategies:

```typescript
import {
	createSchwabAuth,
	AuthStrategy,
	createApiClient,
} from '@sudowealth/schwab-api'

// Create an auth client with your preferred strategy
const auth = createSchwabAuth({
	strategy: AuthStrategy.ENHANCED, // This is the recommended strategy
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
import {
	createSchwabAuth,
	AuthStrategy,
	createApiClient,
} from '@sudowealth/schwab-api'

// Create an auth client with OAuth configuration
// Make sure SCHWAB_CLIENT_ID and SCHWAB_CLIENT_SECRET are defined in your environment (e.g., in .env or your hosting platform's config).
const auth = createSchwabAuth({
	strategy: AuthStrategy.ENHANCED,
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
import {
	createSchwabAuth,
	AuthStrategy,
	createApiClient,
} from '@sudowealth/schwab-api'

// Method 1: Using createSchwabAuth
const auth = createSchwabAuth({
	strategy: AuthStrategy.ENHANCED,
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
} from '@sudowealth/schwab-api'

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
	strategy: AuthStrategy.ENHANCED,
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
import { createApiClient, AuthStrategy } from '@sudowealth/schwab-api'

// Pass auth configuration directly to createApiClient
const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth: {
		strategy: AuthStrategy.ENHANCED,
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

The client aims to cover the primary Schwab API domains. Endpoints are organized
into namespaces accessible via the `client` instance, such as
`client.marketData` and `client.trader`.

### Market Data

Access market data endpoints through `client.marketData.<namespace>`. Each
namespace corresponds to a specific set of functionalities:

- **Instruments**: Search and retrieve instrument details. Use `getInstruments`
  for searching by symbol (including regex) or description. For a direct lookup
  of a single instrument by its CUSIP, use `getInstrumentByCusip`.

  ```typescript
  // Example: Search for instruments using a symbol pattern (regex-like)
  const searchResults = await client.marketData.instruments.getInstruments({
  	queryParams: {
  		symbol: 'SCHW.*', // Schwab API supports a regex-like syntax for symbols
  		projection: 'symbol-search', // 'symbol-search', 'desc-search', 'symbol-regex', 'desc-regex', 'fundamental'
  	},
  })
  console.log('Search Results:', searchResults)

  // Example: Get a specific instrument by its CUSIP
  // const cusipDetails = await client.marketData.instruments.getInstrumentByCusip({
  //   cusip: '037833100' // Example CUSIP for Apple Inc.
  // });
  // console.log('CUSIP Details:', cusipDetails);
  ```

- **Movers**: Get market movers for a specific index.
  ```typescript
  const movers = await client.marketData.movers.getMovers({
  	index: '$DJI',
  	queryParams: { sort: 'PERCENT_CHANGE_UP', freq: 'DAILY' },
  })
  ```
- **Options Chains**: Retrieve option chains for a given symbol.
  ```typescript
  const optionChains = await client.marketData.options.getOptionChains({
  	queryParams: { symbol: 'AAPL', contractType: 'CALL' },
  })
  ```
- **Price History**: Fetch historical price data.
  ```typescript
  const history = await client.marketData.priceHistory.getPriceHistory({
  	queryParams: {
  		symbol: 'MSFT',
  		periodType: 'month',
  		frequencyType: 'daily',
  	},
  })
  ```
- **Quotes**: Get real-time or delayed quotes.
  ```typescript
  const quotes = await client.marketData.quotes.getQuotes({
  	queryParams: { symbols: ['GOOG', 'AMZN'], fields: 'quote,fundamental' },
  })
  ```
- **Market Hours**: Retrieve market hours for specified markets.
  ```typescript
  const hours = await client.marketData.marketHours.getMarketHours({
  	queryParams: { markets: ['equity', 'option'], date: '2024-07-04' },
  })
  ```

### Trading

Access trading-related endpoints through `client.trader.<namespace>`. This
includes account management, order placement, and transaction history:

- **Accounts**: Manage account information.
  ```typescript
  // Example: Get all accounts
  const accounts = await client.trader.accounts.getAccounts({
  	queryParams: { fields: 'positions' },
  })
  // Example: Get a specific account by number
  const specificAccount = await client.trader.accounts.getAccount({
  	accountNumber: '123456789',
  })
  ```
- **Orders**: Place, preview, modify, and cancel orders. Note: use
  `accountNumber` for identifying accounts.
  ```typescript
  // Example: Get orders for an account
  const orders = await client.trader.orders.getOrdersForAccount({
  	accountNumber: 'YOUR_ACCOUNT_NUMBER',
  	queryParams: { maxResults: 10, status: 'FILLED' },
  })
  // Example: Place an order (ensure body matches Schwab schema)
  // const placeOrderResponse = await client.trader.orders.placeOrder({
  //   accountNumber: 'YOUR_ACCOUNT_NUMBER',
  //   body: { /* ... order details ... */ }
  // });
  ```
- **Transactions**: Fetch transaction history for an account.
  ```typescript
  const transactions = await client.trader.transactions.getTransactions({
  	accountNumber: 'YOUR_ACCOUNT_NUMBER',
  	queryParams: {
  		types: 'TRADE',
  		startDate: '2024-01-01T00:00:00Z',
  		endDate: '2024-01-31T23:59:59Z',
  	},
  })
  ```

This structure reflects the `processNamespace` approach used internally to
organize and expose API endpoints, making them discoverable and easy to use.

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
		const firstAccountHash = accounts[0].securitiesAccount.hashedAccountId // This is a hashed ID, ensure your endpoint function can handle it or use the plain account number
		const orders = await client.trader.orders.getOrders({
			accountNumber: firstAccountHash, // Or use the actual account number string if the endpoint expects that
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
import { createApiClient } from '@sudowealth/schwab-api'

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
const marketHoursResponse =
	await client.all.marketData.marketHours.getMarketHours({
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

When using OAuth 2.0 (e.g., `AuthStrategy.CODE_FLOW` with `createSchwabAuth`),
it's crucial to persist the `TokenData` (which includes the access token,
refresh token, and expiration times) to avoid requiring the user to
re-authenticate every time your application starts or their session expires.

The `createSchwabAuth` function (when using `AuthStrategy.CODE_FLOW` or
`AuthStrategy.CUSTOM` with a manager that supports persistence) accepts `load`
and `save` async functions in its `oauthConfig` (for CODE_FLOW) or directly in
`AuthClientOptions` for a custom `ITokenLifecycleManager`.

- **`save(tokenData: TokenData): Promise<void>`**: Called after a new token is
  obtained or an existing token is refreshed. You should store the `tokenData`
  securely (e.g., in a database, encrypted file, or secure storage). The
  `tokenData` object includes `accessToken`, `refreshToken`, `issuedAt`,
  `expiresIn`, `scope`, and `tokenType`.
- **`load(): Promise<TokenData | null>`**: Called when the auth client is
  initialized to retrieve previously stored tokens. Return `null` if no tokens
  are found, prompting a new authentication flow.

**Example of `load` and `save`:**

```typescript
import {
	createSchwabAuth,
	AuthStrategy,
	TokenData,
} from '@sudowealth/schwab-api'
import fs from 'fs/promises' // Example using Node.js fs

const TOKEN_FILE_PATH = './schwab-tokens.json'

const auth = createSchwabAuth({
	strategy: AuthStrategy.CODE_FLOW,
	oauthConfig: {
		clientId: process.env.SCHWAB_CLIENT_ID!,
		clientSecret: process.env.SCHWAB_CLIENT_SECRET!,
		redirectUri: 'https://example.com/callback',
		async save(tokenData: TokenData): Promise<void> {
			console.log('Saving tokens...')
			await fs.writeFile(
				TOKEN_FILE_PATH,
				JSON.stringify(tokenData, null, 2),
				'utf8',
			)
		},
		async load(): Promise<TokenData | null> {
			try {
				console.log('Loading tokens...')
				const data = await fs.readFile(TOKEN_FILE_PATH, 'utf8')
				return JSON.parse(data) as TokenData
			} catch (error) {
				// Ignore error if file doesn't exist or is invalid, proceed to auth
				console.warn('Could not load tokens:', error)
				return null
			}
		},
	},
})

// ... rest of your auth flow (getAuthorizationUrl, exchangeCode)
```

### Token Management and Concurrency

The library provides robust token management, especially concerning concurrent
API calls and token refreshes.

- **Automatic Concurrency Protection**: When you use `createSchwabAuth` with
  `AuthStrategy.ENHANCED`, the `EnhancedTokenManager` provides built-in
  concurrency protection. This ensures that if multiple API calls are made
  simultaneously and the access token has expired or is about to expire, only a
  single refresh attempt will be made. Other concurrent requests will wait for
  the new token, preventing multiple refresh calls that could lead to errors or
  token invalidation.

- **Token Management**: The `EnhancedTokenManager` handles all aspects of token
  lifecycle, including token acquisition, storage, refresh, and concurrency
  protection. This component is used internally by `createSchwabAuth` and is the
  recommended approach for all authentication scenarios.

- **Custom Token Managers**: When using `AuthStrategy.ENHANCED` with a custom
  token manager, all the concurrency protection, refresh handling, and token
  lifecycle management is handled for you. This means you don't need to
  implement concurrency protection yourself within your custom manager.

  ```typescript
  import {
  	ITokenLifecycleManager,
  	TokenData,
  	buildTokenManager,
  	createSchwabAuth,
  	AuthStrategy,
  } from '@sudowealth/schwab-api'

  class MyCustomTokenManager implements ITokenLifecycleManager {
  	privatecurrentTokenData: TokenData | null = null

  	constructor() {
  		// Initialize with loading tokens, e.g., from a secure async storage
  		this.loadInitialToken()
  	}

  	private async loadInitialToken() {
  		// Replace with your actual async loading mechanism
  		// this.currentTokenData = await yourAsyncStorage.getItem('myToken');
  	}

  	async getTokenData(): Promise<TokenData | null> {
  		return this.currentTokenData
  	}

  	async getAccessToken(): Promise<string | null> {
  		// Basic example: assumes tokenData is populated
  		if (
  			this.currentTokenData &&
  			new Date().getTime() <
  				this.currentTokenData.issuedAt +
  					this.currentTokenData.expiresIn * 1000 -
  					60000
  		) {
  			return this.currentTokenData.accessToken
  		}
  		// If expired or missing, refreshIfNeeded should be called by the pipeline
  		return null
  	}

  	supportsRefresh(): boolean {
  		return true // Indicate that this manager can refresh tokens
  	}

  	async refreshIfNeeded(): Promise<boolean> {
  		// Implement your token refresh logic here
  		// For example, call your backend to get a new set of tokens
  		console.log('CustomTokenManager: Attempting to refresh token...')
  		// const newTokens = await callMyBackendToRefresh(this.currentTokenData?.refreshToken);
  		// if (newTokens) {
  		//   this.currentTokenData = newTokens;
  		//   // Persist new tokens if necessary
  		//   // await yourAsyncStorage.setItem('myToken', newTokens);
  		//   console.log('CustomTokenManager: Token refreshed successfully.');
  		//   return true;
  		// }
  		console.log(
  			'CustomTokenManager: Token refresh failed or not supported in this example.',
  		)
  		return false
  	}

  	// Optional: if you want to handle save/load directly within the manager
  	// async save(tokenData: TokenData): Promise<void> { /* ... */ }
  	// async load(): Promise<TokenData | null> { /* ... */ }
  }

  // Using it with createSchwabAuth:
  const customManager = new MyCustomTokenManager()
  const authClient = createSchwabAuth({
  	strategy: AuthStrategy.ENHANCED,
  	tokenManager: customManager,
  	// The EnhancedTokenManager will handle all concurrency protection
  	// and token lifecycle management.
  })

  // With EnhancedTokenManager, you don't need additional token management utilities
  ```

### Cloudflare Workers Compatibility

This library is compatible with Cloudflare Workers and other edge environments.
The authentication module has been specially optimized to work in serverless
environments that may not have access to Node.js-specific APIs like `Buffer`.

When using the library in Cloudflare Workers:

1. Use a fixed redirect URI string rather than constructing it at runtime:

   ```javascript
   // GOOD: Use a fixed string
   const redirectUri = 'https://your-worker-url.workers.dev/callback'

   // BAD: Don't construct dynamically
   // const redirectUri = new URL('/callback', c.req.raw.url).href;
   ```

2. The library automatically handles Base64 encoding for authentication headers
   in different environments:

   ```javascript
   // The library will choose the appropriate method:
   // - btoa() in browser/Cloudflare environments
   // - Buffer.from().toString('base64') in Node.js environments
   ```

3. Token exchange and refresh operations use direct HTTP requests that are
   compatible with all JavaScript environments

#### Example Cloudflare Worker Implementation:

```javascript
// Example Cloudflare Worker using the Schwab API client
export default {
	async fetch(request, env, ctx) {
		try {
			const url = new URL(request.url)
			const path = url.pathname

			// Fixed redirect URI
			const redirectUri = 'https://your-worker-url.workers.dev/callback'

			if (path === '/login') {
				// Initialize the auth client
				const auth = createSchwabAuth({
					clientId: env.SCHWAB_CLIENT_ID,
					clientSecret: env.SCHWAB_CLIENT_SECRET,
					redirectUri,
				})

				// Generate the authorization URL
				const { authUrl } = auth.getAuthorizationUrl()
				return Response.redirect(authUrl, 302)
			}

			if (path === '/callback') {
				const code = new URL(request.url).searchParams.get('code')

				const auth = createSchwabAuth({
					clientId: env.SCHWAB_CLIENT_ID,
					clientSecret: env.SCHWAB_CLIENT_SECRET,
					redirectUri,
				})

				// Exchange the code for tokens
				const tokenSet = await auth.exchangeCode(code)

				// Create the API client with the authenticated auth client
				const client = createApiClient({ auth })

				// Now you can make API calls
				// const accounts = await client.trader.accounts.getAccounts();

				return new Response('Authentication successful!')
			}

			return new Response('Not found', { status: 404 })
		} catch (error) {
			return new Response(`Error: ${error.message}`, { status: 500 })
		}
	},
}
```

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

The Schwab API client provides robust error handling mechanisms to help you
manage various issues that can occur during API interactions.

### SchwabApiError

Most errors originating from the Schwab API (e.g., invalid requests,
authentication failures, server errors) are thrown as instances of
`SchwabApiError`. This error class provides detailed context about the failure:

- `message`: A human-readable error message.
- `details`: An object often containing the raw error response from Schwab,
  including specific error codes or descriptions.
- `originalStatus`: The HTTP status code of the response (e.g., 400, 401, 500).
- `isRetryable`: A boolean indicating if the error is considered transient and
  potentially resolvable by retrying the request.

```typescript
// In your try-catch block
if (client.errors.isSchwabApiError(error)) {
	console.error('Schwab API Error:', error.message)
	console.error('HTTP Status:', error.status)
	console.error('Response Body:', JSON.stringify(error.body, null, 2))
	if (error.isRetryable && error.isRetryable()) {
		console.log(
			'This error might be retryable. You can safely retry this request.',
		)
	}
} else {
	console.error('An unexpected error occurred:', error)
}
```

### Specialized Error Classes

In addition to the general `SchwabApiError`, the client may throw more
specialized error classes for specific scenarios, such as:

- `SchwabAuthError`: For errors related to the OAuth authentication process
  (e.g., failed token exchange).
- `SchwabRateLimitError`: Specifically for 429 (Too Many Requests) errors.
- `SchwabGatewayError`: For 502, 503, 504 errors indicating gateway issues.
- `SchwabTimeoutError`: For network timeouts during requests.

These specialized errors inherit from `SchwabApiError` and can be checked using
their respective type guards (e.g.,
`client.errors.isSchwabRateLimitError(error)`).

### Retry Strategies and Middleware

The client incorporates a retry mechanism as part of its default middleware
pipeline. This is primarily handled by the `withRetry` middleware, which
automatically retries requests that fail due to common transient issues like
network errors or specific server-side problems (e.g., 5xx status codes, 429 if
configured).

You can customize the retry behavior through the `middleware` option in
`createApiClient`:

```typescript
const client = createApiClient({
	// ... other configurations (auth, etc.)
	middleware: {
		retry: {
			maxAttempts: 5, // Total number of attempts (1 initial + 4 retries)
			maxDelayMs: 60000, // Maximum delay between retries (e.g., 60 seconds)
			backoffFactor: 2, // Factor by which the delay increases (e.g., 1s, 2s, 4s, ...)
			initialDelayMs: 1000, // Initial delay before the first retry
			advanced: {
				// If true, the client will respect the 'Retry-After' header sent by Schwab for 429 errors.
				respectRetryAfter: true,
				// Custom function to determine if an error should be retried.
				// By default, it retries network errors, 429s, and 5xx errors.
				shouldRetry: (error, attemptNumber) => {
					if (
						client.errors.isSchwabApiError(error) &&
						error.originalStatus === 503
					) {
						return attemptNumber < 3 // Only retry 503 errors twice
					}
					// Ensure isSchwabApiError check before accessing properties like isRetryable
					let defaultShould = false
					if (client.errors.isSchwabApiError(error)) {
						defaultShould = client.middlewareHelpers.defaultShouldRetry(
							error,
							attemptNumber,
							{ maxAttempts: 5 },
						)
					}
					return defaultShould
				},
			},
		},
	},
})
```

This configuration allows you to fine-tune aspects like the number of retry
attempts, delay strategy (exponential backoff), and whether to honor
`Retry-After` headers, which is particularly important for rate limiting.

### Partial Success (Symbol-Level Errors)

As detailed in the
[Handling Partial Success in Quote Endpoints](#handling-partial-success-in-quote-endpoints)
section, errors related to individual symbols within a multi-symbol quote
request are handled differently. These are not thrown as top-level
`SchwabApiError`s but are instead embedded in the success response. You should
use the utility functions provided in `client.marketData.quotes` to identify and
manage these symbol-specific issues.

### Handling Partial Success in Quote Endpoints

When requesting quotes for multiple symbols (e.g.,
`client.marketData.quotes.getQuotes({ queryParams: { symbols: ['AAPL', 'INVALID', 'MSFT'] } })`),
the API might return a partial success (HTTP 200 or 207) if some symbols are
valid but others are not. In such cases, the response body will contain data for
valid symbols and error information for invalid ones.

The library provides utility functions to help manage these scenarios, located
within the `client.marketData.quotes` namespace (originating from
`src/market-data/quotes/index.ts`).

- **`hasSymbolError(responseBody: QuotesResponse, symbol: string): boolean`**:
  Checks if a specific symbol has an error in the quotes response.
- **`extractQuoteErrors(responseBody: QuotesResponse): QuoteSymbolError[]`**:
  Extracts all symbol-level errors from the response.

**Example:**

```typescript
import {
	createApiClient,
	createSchwabAuth,
	AuthStrategy,
} from '@sudowealth/schwab-api'
// Assuming client is already initialized as shown in Quick Start or Usage Examples
// const client = ...;

async function fetchAndProcessQuotes(client) {
	try {
		const response = await client.marketData.quotes.getQuotes({
			queryParams: { symbols: ['AAPL', 'INVALID_SYMBOL', 'MSFT'] },
		})

		// The overall request might be successful (e.g. HTTP 200 or 207 Multi-Status)
		// but individual symbols can have errors.
		console.log('Raw Response:', JSON.stringify(response, null, 2))

		// Check for errors for a specific symbol
		if (client.marketData.quotes.hasSymbolError(response, 'INVALID_SYMBOL')) {
			console.warn('INVALID_SYMBOL has an error in the response.')
		}

		// Extract all symbol-level errors
		const errors = client.marketData.quotes.extractQuoteErrors(response)
		if (errors.length > 0) {
			console.warn('Errors found for the following symbols:')
			errors.forEach((error) => {
				console.warn(
					`- Symbol: ${error.symbol}, Message: ${error.message}, Code: ${error.code}`,
				)
			})
		}

		// Process valid quotes (filter out those with errors if necessary)
		const validQuotes = Object.values(response).filter(
			(quote) =>
				quote &&
				typeof quote === 'object' &&
				quote.assetType &&
				!client.marketData.quotes.hasSymbolError(response, quote.symbol),
		)
		console.log('Valid Quotes:', validQuotes)
	} catch (error) {
		// Handle top-level API errors (e.g., network issues, auth problems)
		if (client.errors.isSchwabApiError(error)) {
			console.error('Schwab API Error:', error.message, error.details)
		} else {
			console.error('An unexpected error occurred:', error)
		}
	}
}

// Example usage (ensure client is initialized with auth)
// const auth = createSchwabAuth({ strategy: AuthStrategy.STATIC, accessToken: 'YOUR_TOKEN' });
// const client = createApiClient({ auth });
// fetchAndProcessQuotes(client);
```

This allows you to gracefully handle responses where some requested symbols
could not be processed, while still utilizing the data for the symbols that were
successful.

## Advanced Configuration

The `createApiClient` function offers several options for advanced
customization, including environment settings, custom fetch implementations, and
middleware configuration.

### Middleware Pipeline

The client uses a middleware pipeline to handle common tasks like
authentication, rate limiting, and retries. This pipeline is built using
`buildMiddlewarePipeline` and is configurable via the `middleware` option in
`createApiClient`.

By default, the pipeline includes:

- **Authentication**: Automatically injects the access token into requests.
- **Rate Limiting**: Handles `429 Too Many Requests` errors (if
  `respectRetryAfter` is enabled for retries, it often covers this).
- **Retries**: Implements exponential backoff for transient network errors and
  specific server-side errors (e.g., `5xx`).

#### Customizing Built-in Middleware

You can customize the behavior of the built-in middleware or disable them
entirely by passing a configuration object to the `middleware` property.

```typescript
import {
	createApiClient,
	createSchwabAuth,
	AuthStrategy,
} from '@sudowealth/schwab-api'

// Assuming auth is configured
const auth = createSchwabAuth({
	strategy: AuthStrategy.STATIC,
	accessToken: 'YOUR_TOKEN',
})

const client = createApiClient({
	auth,
	config: { environment: 'PRODUCTION' },
	middleware: {
		// Disable rate limiting middleware entirely
		rateLimit: false,
		// Customize retry behavior
		retry: {
			maxAttempts: 5,
			maxDelayMs: 30000, // Max delay between retries
			// Advanced options for more granular control
			advanced: {
				shouldRetry: (error, attempt) => {
					// Custom logic to decide if an error should be retried
					// For example, only retry on 503 errors
					if (
						client.errors.isSchwabApiError(error) &&
						error.originalStatus === 503
					) {
						return true
					}
					// Ensure isSchwabApiError check before accessing properties like isRetryable
					let defaultShould = false
					if (client.errors.isSchwabApiError(error)) {
						defaultShould = client.middlewareHelpers.defaultShouldRetry(
							error,
							attempt,
							{ maxAttempts: 5 },
						)
					}
					return defaultShould
				},
				getRetryDelayMs: (error, attempt) => {
					// Custom delay logic
					return attempt * 1000 // e.g., 1s, 2s, 3s...
				},
				respectRetryAfter: true, // Honor Retry-After header from Schwab (recommended)
			},
		},
		// You can also disable token injection if handling auth entirely separately, though not common
		// tokenInjector: false,
	},
})

// Example call
async function exampleCall() {
	try {
		const quotes = await client.marketData.quotes.getQuotes({
			queryParams: { symbols: ['AAPL'] },
		})
		console.log(quotes)
	} catch (error) {
		console.error('Failed after custom retries:', error)
	}
}

exampleCall()
```

This approach replaces older methods of chaining individual middleware functions
like `withRetry` or `withRateLimit` directly. The `middleware` configuration
object provides a centralized way to manage these aspects. The pipeline also
automatically uses concurrency-protected token refresh if an authentication
manager that supports refresh (e.g., via `createSchwabAuth` with
`AuthStrategy.CODE_FLOW`) is provided.

### Custom Fetch Implementation

The client uses a custom fetch implementation to handle network requests. This
allows for more granular control over request and response processing.

## API Reference

### Import Patterns

The Schwab API client provides a single, consistent entry point through the
`createApiClient` function. This is the recommended way to access all
functionality:

```typescript
import { createApiClient } from '@sudowealth/schwab-api'

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
  - `config.oauthConfig`: Required for CODE_FLOW strategy // Properties of the
    auth object returned by createSchwabAuth:
  - `auth.getAuthorizationUrl()`: Generate auth URL (for CODE_FLOW)
  - `auth.exchangeCode(code)`: Exchange code for tokens (for CODE_FLOW)
  - `auth.refresh()`: Attempt to refresh access token (if manager
    supportsRefresh)
  - `auth.onRefresh(callback)`: Register a callback triggered after a successful
    token refresh.
  - `auth.isRefreshTokenNearingExpiration()`: Check if refresh token is near
    expiration (if applicable).
  - `auth.getTokenData()`: Retrieve the current TokenData (if available).

### API Client Creation

- `createApiClient(options)`: Create a configured API client with all namespaces
  - `options.config`: Override default configuration
  - `options.auth`: Authentication configuration (recommended)
    - Can be a string access token, an object implementing
      ITokenLifecycleManager, or an AuthFactoryConfig
    - String tokens are automatically wrapped with EnhancedTokenManager
  - `options.middleware`: Configure middleware pipeline including rate limits,
    retries, and additional custom middleware

### Token Management

- `buildTokenManager(input, options)`: Unified function to create a token
  manager from various inputs
  - Automatically handles static tokens, existing token managers, and adds
    concurrency protection
  - Recommended approach for all token management needs
- `ITokenLifecycleManager`: Interface for token lifecycle management
- `EnhancedTokenManager`: Robust implementation for token lifecycle management
  that handles authentication, refresh, and concurrency protection

#### Public Token Utility Functions

- `isTokenLifecycleManager(obj)`: Type guard to check if an object implements
  the token manager interface
- `EnhancedTokenManager`: Create a fully-featured token manager

### Public Middleware Components

The library exposes key middleware components that can be used to customize the
request pipeline:

- `withTokenAuth(tokenManager)`: Add auth headers and auto-refresh
- `withRateLimit(options)`: Add rate limiting (enabled by default)
- `

## Authentication Debugging Tools

The package includes several tools to help diagnose and fix authentication
issues, particularly "Unauthorized" (401) errors.

### Enhanced Token Validation and Debugging

```javascript
const {
	validateTokens,
} = require('@sudowealth/schwab-api/examples/validate-tokens')

// Validate your current tokens
const result = await validateTokens()

// Output includes detailed token validation information:
// - Token format validation
// - Expiration status
// - Endpoint compatibility
// - Authorization header format
```

### Token Refresh Debugging

For diagnosing issues with token refresh, particularly in Cloudflare Workers:

```javascript
const {
	debugTokenRefresh,
} = require('@sudowealth/schwab-api/examples/debug-token-refresh')

// Capture detailed information about token refresh
const result = await debugTokenRefresh()

// Returns comprehensive information including:
// - HTTP request/response details during refresh
// - Token format validation
// - Refresh success/failure analysis
```

### Request/Response Debugging

You can add detailed request/response logging to debug authentication issues:

```javascript
const { createApiClient, middleware } = require('@sudowealth/schwab-api')
const { withDebug } = middleware

const client = createApiClient({
	// your auth config here
	middleware: {
		before: [
			withDebug({
				tag: 'auth-debug',
				logRequest: true,
				logResponse: true,
				logBodies: true, // Be careful with sensitive data
				prettyPrint: true,
			}),
		],
	},
})
```

### Token Refresh Tracing

For detailed diagnostics of the token refresh process:

```javascript
const { auth } = require('@sudowealth/schwab-api')
const { TokenRefreshTracer } = auth

// Configure the tracer
const tracer = TokenRefreshTracer.getInstance({
	includeRawResponses: true, // WARNING: Contains sensitive data
	maxHistorySize: 20,
})

// Get detailed reports after operations
const report = tracer.getLatestRefreshReport()
console.log('Refresh summary:', report.summary)
```

For more comprehensive documentation on troubleshooting authentication issues,
see the
[Token Refresh Troubleshooting Guide](./docs/token-refresh-troubleshooting.md).
