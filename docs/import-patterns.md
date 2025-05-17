# Import Patterns and API Structure

This document outlines the recommended import patterns for the Schwab API client
library and explains the reasoning behind the API structure.

## Recommended Import Pattern

The primary entry point for the library is the `createApiClient` function. This
is the recommended way to access all functionality:

```typescript
import { createApiClient } from 'schwab-api'

// Create your API client
const client = createApiClient({
	config: { environment: 'SANDBOX' },
	auth: 'YOUR_ACCESS_TOKEN', // or a token manager
})

// Access API endpoints through namespaces
const quotes = await client.marketData.quotes.getQuotes({
	queryParams: { symbols: ['AAPL', 'MSFT'] },
})

// Access utilities from client object
if (client.errors.isSchwabApiError(error)) {
	// Handle API errors
}
```

## API Structure

The API is organized hierarchically:

1. **Client Level**: The object returned by `createApiClient`

   - Contains all namespaces and utilities
   - Provides a consistent interface for all functionality

2. **Namespace Level**: Major API categories

   - `marketData`: Market data endpoints (quotes, price history, etc.)
   - `trader`: Trading endpoints (accounts, orders, etc.)
   - `auth`: Authentication utilities
   - `errors`: Error types and utilities
   - `schemas`: Schemas for API data validation

3. **Module Level**: Specific feature sets within namespaces

   - e.g., `marketData.quotes`, `trader.accounts`
   - Each module contains related endpoints and utilities

4. **Function Level**: Individual API endpoints and utilities
   - e.g., `marketData.quotes.getQuotes`, `trader.accounts.getAccount`

## Why This Structure?

1. **Discoverability**: The hierarchical structure makes it easy to discover
   available functionality through IDE autocomplete
2. **Context Consistency**: All modules and endpoints share the same context,
   ensuring consistent behavior
3. **Middleware Pipeline**: The client manages a middleware pipeline that all
   endpoints benefit from
4. **Unified Configuration**: All endpoints use the same configuration

## Direct Imports (Not Recommended)

The library no longer recommends or supports direct imports from submodules.
Previously, you could:

```typescript
// DEPRECATED - No longer recommended
import { getQuotes } from 'schwab-api/market-data/quotes'
```

This import pattern created confusion about the recommended approach and made it
harder to maintain a consistent API surface.

All modules are now marked as `@internal` to discourage direct imports. The
recommended approach is to use the client object returned by `createApiClient`.

## Unified Discovery with the `all` Namespace

For comprehensive access to all types and utilities, you can use the `all`
namespace:

```typescript
// Use the unified discovery namespace
const isRetryable = client.all.errors.isRetryableError(error)
const errorCategory = client.all.errors.getErrorCategory(error)
```

This provides access to everything in a single structured object, making it
easier to discover available functionality.

## Error Types and Auth Utilities

For backward compatibility and convenience, core error types and authentication
utilities are still directly exported from the main module:

```typescript
import { SchwabError, SchwabApiError, createSchwabAuthClient } from 'schwab-api'
```

These exports are considered part of the stable public API.
