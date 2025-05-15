# Schwab API Client

TypeScript client for the Charles Schwab API.

## ⚠️ Unofficial Library ⚠️

**This is an unofficial, community-developed TypeScript client library for
interacting with Schwab APIs. It has not been approved, endorsed, or certified
by Charles Schwab. It is provided as-is, and its functionality may be incomplete
or unstable. Use at your own risk, especially when dealing with financial data
or transactions.**

## Features

- **OAuth Helper**: Client-credentials OAuth flow with automatic token handling
- **Request Pipeline**: Middleware system for auth, rate limits, and retries
- **Type Safety**: Complete TypeScript definitions for all API endpoints
- **Zod Validation**: Runtime schema validation for API responses

## Installation

```bash
npm install schwab-api
# or
yarn add schwab-api
# or
pnpm add schwab-api
```

## Usage

```typescript
import {
  createAuthClient,
  configureSchwabApi,
  withRateLimit,
  withRetry
} from 'schwab-api';

// Create OAuth client
const auth = createAuthClient({
  clientId: process.env.SCHWAB_ID,
  clientSecret: process.env.SCHWAB_SECRET,
  redirectUri: 'https://example.com/callback',
  // Optional persistence functions
  // Save tokens whenever new ones are obtained or refreshed
  save: async (tokens) => {
    // Example: store in secure storage
    await fs.writeFile('tokens.json', JSON.stringify(tokens), 'utf8');
    console.log('Tokens saved to tokens.json');
  },
  // Load tokens when refreshing (avoids needing to re-authenticate)
  load: async () => {
    try {
      // Example: load from secure storage
      const data = await fs.readFile('tokens.json', 'utf8');
      return JSON.parse(data);
    } catch (err) {
      // If no tokens exist yet, return null (triggers new auth flow)
      return null;
    }
  }
});

// Generate login URL
console.log('Visit:', auth.getAuthorizationUrl().authUrl);

// Exchange auth code for tokens
const tokenSet = await auth.exchangeCodeForTokens({ 
  code: '<authorization-code>' 
});

// Create API client with middleware
const schwab = await configureSchwabApi({
  tokens: {
    current: () => tokenSet,
    refresh: () => auth.refreshTokens()
  },
  middlewares: [
    withRateLimit(120, 60000), // 120 requests per minute
    withRetry({ max: 3 })      // Retry failed requests
  ]
});

// Make API calls
const accounts = await schwab.accounts.getAccounts();
console.log('Accounts:', accounts);

// Example: Get orders for an account
if (accounts.length > 0) {
  const firstAccountHash = accounts[0].securitiesAccount.hashedAccountId;
  const orders = await schwab.orders.getOrders({
    accountId: firstAccountHash,
  });
  console.log(`Orders for account ${firstAccountHash}:`, orders);
}
```

## Important Notes

### Token Persistence

The `save` and `load` functions provided to `createAuthClient` allow you to persist tokens between application restarts:

1. **save(tokens)**: Called automatically whenever:
   - New tokens are obtained via `exchangeCodeForTokens()`
   - Tokens are refreshed via `refreshTokens()`

2. **load()**: Called automatically when:
   - `refreshTokens()` is invoked and there's no in-memory token
   - Used to retrieve previously saved tokens for refresh operations

This persistence mechanism prevents users from having to re-authenticate every time your application restarts, as long as the refresh token hasn't expired.

In production applications, you should use a secure storage mechanism appropriate for your platform (e.g., encrypted storage, secure key vault, etc.).

### Refresh Token Expiration

**Important**: Schwab refresh tokens have a hard 7-day expiration limit that cannot be extended. This is a security measure enforced by Schwab's API servers, not a limitation of this library.

When a refresh token expires:
- The `refreshTokens()` method will throw a `SchwabAuthError` with code `TOKEN_EXPIRED`
- The user must complete a full re-authentication flow through Schwab's login page
- There is no way to refresh tokens indefinitely without user interaction

#### Handling Token Expiration

Your application must be designed to handle the 7-day refresh token expiration. Here are recommended strategies:

1. **Proactively Check Expiration**:
   ```typescript
   if (auth.isRefreshTokenNearingExpiration()) {
     // Show a message to the user that they will need to re-authenticate soon
     showReauthenticationPrompt("Your Schwab session will expire soon. Please re-authenticate to maintain uninterrupted access.");
   }
   ```

2. **Gracefully Handle Expiration Errors**:
   ```typescript
   try {
     await schwab.accounts.getAccounts();
   } catch (error) {
     if (error instanceof SchwabAuthError && error.code === 'TOKEN_EXPIRED') {
       // Inform the user that their session has expired
       showLoginPrompt("Your Schwab session has expired. Please log in again to continue.");
       // Redirect to auth flow
       window.location.href = auth.getAuthorizationUrl().authUrl;
     }
   }
   ```

3. **Plan Your Application UX**:
   - Design your application with the understanding that users will need to re-authenticate weekly
   - Consider scheduling non-critical operations to avoid interrupting important workflows
   - Store user preferences and application state independently from authentication state

**Best Practice**: Include clear messaging in your application about the 7-day session limit so users understand this is a security feature of Schwab's API, not a limitation of your application.

## API Reference

### OAuth

- `createAuthClient(options)`: Create OAuth client
- `auth.getAuthorizationUrl()`: Generate auth URL
- `auth.exchangeCodeForTokens({ code })`: Exchange code for tokens
- `auth.refreshTokens()`: Refresh access token
- `auth.onRefresh(callback)`: Register refresh callback
- `auth.isRefreshTokenNearingExpiration()`: Check if refresh token is near expiration

### Request Pipeline

- `configureSchwabApi(options)`: Configure API client with middleware
- `withAuth(tokens)`: Add auth headers and auto-refresh
- `withRateLimit(max, windowMs)`: Add rate limiting
- `withRetry({ max, baseMs })`: Add retry with exponential backoff

## Error Handling

```typescript
try {
  await schwab.accounts.getAccounts();
} catch (error) {
  if (error instanceof SchwabAuthError) {
    if (error.code === 'TOKEN_EXPIRED') {
      // Refresh token has expired (after 7 days)
      // Must re-authenticate via authorization flow
    }
  }
}
```

## Development

- Clone the repository.
- Install dependencies: `npm install`
- Build: `npm run build`
- Test: `npm run test`

### Installing Beta Versions

To install the latest beta release:

```bash
npm install @sudowealth/schwab-api@beta
```

### Publishing Beta Releases

This project uses semantic-release for automated versioning and publishing. 

See [BETA-RELEASE.md](./BETA-RELEASE.md) for instructions on publishing beta releases with semantic-release.

## License

MIT