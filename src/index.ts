// Public surface of the schwab-api package

// Import specific error types for re-export
import {
	SchwabApiError,
	isSchwabApiError,
	SchwabAuthError,
	SchwabError,
	isSchwabError,
} from './errors'

/**
 * INTERNAL NAMESPACES
 *
 * These exports are for internal use only and should not be directly imported by consumers.
 * The recommended approach is to use the `createApiClient` function and access namespaces
 * through the returned client object.
 *
 * @internal
 * @private
 */
export * as auth from './auth'
export * as marketData from './market-data'
export * as trader from './trader'
export * as schemas from './schemas'
export * as errors from './errors'

/**
 * PUBLIC API
 *
 * These exports are the stable public API of the package.
 * Directly export core error types for convenience and backward compatibility.
 */
export {
	SchwabError,
	isSchwabError,
	SchwabApiError,
	isSchwabApiError,
	SchwabAuthError,
}

/**
 * API Client
 *
 * The main entry point for using the Schwab API. The createApiClient function
 * creates a configured API client that can be used to make API calls.
 *
 * You can provide authentication in multiple ways:
 * - Use a static token string for simple scripts
 * - Use an object implementing ITokenLifecycleManager
 * - Use the built-in OAuth flow with createSchwabAuthClient
 */
export {
	createApiClient,
	type SchwabApiClient,
	type CreateApiClientOptions,
} from './create-api-client'

/**
 * Authentication Modules
 *
 * These exports provide tools for handling OAuth authentication with Schwab.
 * You can use these to implement the full OAuth flow with authorization URL
 * generation, code exchange, and token refresh.
 *
 * For most applications, use createSchwabAuthClient for a unified approach.
 */
export type { TokenSet } from './auth/types'

/**
 * Token Management Utilities
 *
 * These exports provide utilities for token lifecycle management.
 * Use these interfaces and classes to create and manage tokens
 * for authentication with the Schwab API.
 */
export {
	// Core interfaces
	type ITokenLifecycleManager,
	type TokenData,

	// Token manager implementations
	StaticTokenManager,
	createStaticTokenManager,
	ConcurrentTokenManager,

	// Helper functions
	buildTokenManager, // Recommended approach for token manager creation
	isTokenLifecycleManager,
} from './auth/token-lifecycle-manager'

/**
 * Public Middleware Components
 *
 * These exports provide middleware components that can be used to customize
 * the API client's request pipeline. You can use these to add functionality
 * like authentication, rate limiting and retries.
 */
// Middleware type and compose function
export { type Middleware, compose } from './middleware/compose'

// Middleware functions
export {
	withTokenAuth,
	type TokenAuthOptions,
} from './middleware/with-token-auth'
export {
	withRateLimit,
	type RateLimitOptions,
} from './middleware/with-rate-limit'
export { withRetry, type RetryOptions } from './middleware/with-retry'
