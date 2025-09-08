# CLAUDE.md

This file provides guidance to coding agents when working with code in this
repository.

## Overview

This is a TypeScript client library for the Charles Schwab trading API. It
provides OAuth authentication, market data access, and trading functionality
with full type safety and runtime validation using Zod.

## Common Commands

```bash
# Development
npm run build       # Clean and compile TypeScript to dist/

# Code Quality (run before committing)
npm run validate    # Format, lint, and typecheck
npm run lint        # Lint with Biome
npm run typecheck   # TypeScript type checking
npm run format      # Format with Biome

```

## Architecture

### Directory Structure

- `src/auth/` - OAuth authentication and token management
- `src/market-data/` - Market data endpoints (quotes, options, price history,
  etc.)
- `src/trader/` - Trading endpoints (accounts, orders, transactions)
- `src/middleware/` - Request pipeline middleware (auth, rate limiting, retry)
- `src/core/` - Core HTTP client and configuration
- `src/schemas/` - Shared Zod schemas
- `src/utils/` - Utility functions

### Key Patterns

1. **Feature Organization**: Each API feature follows this structure:

   ```
   feature/
   ├── endpoints.ts  # Endpoint metadata definitions
   ├── schema.ts     # Zod schemas for validation
   └── index.ts      # Public exports
   ```

2. **Endpoint Definition**: New endpoints use metadata pattern:

   ```typescript
   export const endpointMeta = {
   	method: 'GET' as const,
   	path: '/path/{param}',
   	description: 'Description',
   	request: {
   		pathParams: z.object({ param: z.string() }),
   		queryParams: z.object({ optional: z.string().optional() }),
   	},
   	response: responseSchema,
   }
   ```

3. **Middleware Pipeline**: Middleware executes in order:
   - Pre-request → Auth → Rate Limit → Retry → Request → Post-request

4. **Error Handling**: Use typed errors from `src/errors.ts`:
   - `SchwabAuthError` for authentication issues
   - `SchwabAPIError` for API errors
   - `SchwabValidationError` for validation failures

## Authentication Flow

1. Create auth manager:
   `createSchwabAuth({ oauthConfig: { clientId, clientSecret, redirectUri } })`
2. Generate auth URL: `auth.getAuthorizationUrl().authUrl`
3. Exchange code: `auth.exchangeCode(authorizationCode)`
4. Create API client: `createApiClient({ auth })`

## Important Notes

- **Token Expiry**: Refresh tokens expire after 7 days (Schwab limitation)
- **Node Version**: Requires Node.js 20+
- **Module Type**: ESM-only package
- **Commit Format**: Use Conventional Commits (feat:, fix:, docs:, etc.)
- **PR Target**: Submit all PRs to `main` branch
- **Breaking Changes**: Mark with `!` suffix or `BREAKING CHANGE:` footer

## Adding New Features

1. Create feature directory under appropriate namespace
2. Define schemas in `schema.ts`
3. Create endpoint metadata in `endpoints.ts`
4. Export through `index.ts`
5. Add to parent namespace exports
6. Run `npm run validate` before committing
