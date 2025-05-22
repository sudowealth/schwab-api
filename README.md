# Schwab API Client

TypeScript client for Charles Schwab API with OAuth support, market data,
trading functionality, and complete type safety.

## Unofficial Library

**This is an unofficial, community-developed TypeScript client library for
interacting with Schwab APIs. It has not been approved, endorsed, or certified
by Charles Schwab. It is provided as-is, and its functionality may be incomplete
or unstable. Use at your own risk, especially when dealing with financial data
or transactions.**

## Getting Started

To use the Schwab API, you'll need to register for a developer account:

1. Visit
   [Schwab Developer Portal](https://developer.schwab.com/user-guides/get-started/introduction)
2. Sign up for a developer account
3. Create an application to obtain your client ID and secret
4. Review the API documentation and usage limits

## Features

- **OAuth Helper**: Client-credentials OAuth flow with automatic token handling
- **Request Pipeline**: Middleware system for auth, rate limits, and retries
- **Type Safety**: Complete TypeScript definitions for all API endpoints
- **Zod Validation**: Runtime schema validation for API responses
- **Market Data**: Real-time quotes, price history, options chains, market
  hours, and movers
- **Trading**: Account management, order placement, transaction history, and
  user preferences

## Installation

Available on [npm](https://www.npmjs.com/package/@sudowealth/schwab-api):

```bash
npm install @sudowealth/schwab-api
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

### Basic Setup

```typescript
import {
	createSchwabAuthClient,
	configureSchwabApi,
} from '@sudowealth/schwab-api'

// Create unified auth client
const auth = createSchwabAuthClient({
	clientId: process.env.SCHWAB_ID,
	clientSecret: process.env.SCHWAB_SECRET,
	redirectUri: 'https://example.com/callback',
})

// Generate login URL
console.log('Visit:', auth.getAuthorizationUrl().authUrl)

// Exchange auth code for tokens
const tokens = await auth.exchangeCode('<authorization-code>')

// Create API client
const schwab = await configureSchwabApi({
	tokens: {
		current: () => tokens,
		refresh: () => auth.refresh(tokens.refresh_token),
	},
})
```

### Market Data

```typescript
// Get real-time quotes
const quotes = await schwab.marketData.quotes.getQuotes({
	symbols: 'AAPL,MSFT,GOOGL',
	fields: 'quote,fundamental',
})

// Get price history
const history = await schwab.marketData.priceHistory.getPriceHistory({
	symbol: 'AAPL',
	periodType: 'day',
	period: 10,
	frequencyType: 'minute',
	frequency: 1,
})

// Get options chain
const options = await schwab.marketData.options.getOptionChain({
	symbol: 'AAPL',
	contractType: 'CALL',
	strikeCount: 10,
})

// Get market hours
const hours = await schwab.marketData.marketHours.getMarketHours({
	markets: 'equity,option',
})

// Get movers
const movers = await schwab.marketData.movers.getMovers({
	index: '$SPX.X',
	direction: 'up',
	change: 'percent',
})

// Search instruments
const instruments = await schwab.marketData.instruments.getInstruments({
	symbol: 'AAPL',
	projection: 'symbol-search',
})
```

### Trading

```typescript
// Get accounts
const accounts = await schwab.trader.accounts.getAccounts()

// Get account details
const account = await schwab.trader.accounts.getAccount({
	accountId: 'your-account-hash',
	fields: 'positions',
})

// Get orders
const orders = await schwab.trader.orders.getOrders({
	accountId: 'your-account-hash',
	maxResults: 50,
})

// Place an order
const orderResponse = await schwab.trader.orders.placeOrder({
	accountId: 'your-account-hash',
	orderType: 'MARKET',
	session: 'NORMAL',
	duration: 'DAY',
	orderStrategyType: 'SINGLE',
	orderLegCollection: [
		{
			instruction: 'BUY',
			quantity: 10,
			instrument: {
				symbol: 'AAPL',
				assetType: 'EQUITY',
			},
		},
	],
})

// Get transactions
const transactions = await schwab.trader.transactions.getTransactions({
	accountId: 'your-account-hash',
	type: 'TRADE',
	startDate: '2024-01-01',
	endDate: '2024-12-31',
})

// Get user preferences
const preferences = await schwab.trader.userPreference.getUserPreference()
```

### Advanced Configuration with Middleware

```typescript
import {
	configureSchwabApi,
	withRateLimit,
	withRetry,
} from '@sudowealth/schwab-api'

const schwab = await configureSchwabApi({
	tokens: {
		current: () => tokens,
		refresh: () => auth.refresh(tokens.refresh_token),
	},
	middlewares: [
		withRateLimit(120, 60000), // 120 requests per minute
		withRetry({ max: 3, baseMs: 1000 }), // Retry with exponential backoff
	],
})
```

## Important Notes

### Token Management

The auth client provides a unified interface for OAuth operations:

- **`getAuthorizationUrl()`**: Generate URL for user login
- **`exchangeCode(code)`**: Exchange authorization code for tokens
- **`refresh(refreshToken)`**: Refresh expired access tokens

### Refresh Token Expiration

**Important**: Schwab refresh tokens have a hard 7-day expiration limit that
cannot be extended. This is a security measure enforced by Schwab's API servers.

When a refresh token expires:

- The `refresh()` method will throw a `SchwabAuthError` with code
  `TOKEN_EXPIRED`
- The user must complete a full re-authentication flow through Schwab's login
  page
- There is no way to refresh tokens indefinitely without user interaction

#### Handling Token Expiration

```typescript
try {
	const newTokens = await auth.refresh(oldRefreshToken)
	// Update stored tokens
} catch (error) {
	if (error instanceof SchwabAuthError && error.code === 'TOKEN_EXPIRED') {
		// Redirect user to re-authenticate
		const { authUrl } = auth.getAuthorizationUrl()
		window.location.href = authUrl
	}
}
```

### API Structure

The API client is organized into logical namespaces:

- **`marketData`**: Real-time and historical market data

  - `quotes`: Real-time quotes and fundamentals
  - `priceHistory`: Historical price data and charts
  - `options`: Options chains and pricing
  - `marketHours`: Trading hours for different markets
  - `movers`: Top gaining/losing securities
  - `instruments`: Security search and lookup

- **`trader`**: Account and trading operations
  - `accounts`: Account information and positions
  - `orders`: Order management and execution
  - `transactions`: Transaction history and details
  - `userPreference`: User settings and preferences

## Error Handling

```typescript
import { SchwabApiError, SchwabAuthError } from '@sudowealth/schwab-api'

try {
	await schwab.trader.accounts.getAccounts()
} catch (error) {
	if (error instanceof SchwabAuthError) {
		if (error.code === 'TOKEN_EXPIRED') {
			// Handle expired tokens
		}
	} else if (error instanceof SchwabApiError) {
		// Handle API errors
		console.error('API Error:', error.message)
	}
}
```

## Development

- Clone the repository
- Install dependencies: `npm install`
- Build: `npm run build`
- Test: `npm run test`
- Test (watch mode): `npm run test:watch`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Format: `npm run format`
- Validate all: `npm run validate`

### Installing Beta Versions

To install the latest beta release:

```bash
npm install @sudowealth/schwab-api@beta
```

## License

MIT
