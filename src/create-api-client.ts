import * as auth from './auth'
import { type ITokenLifecycleManager } from './auth/token-lifecycle-manager'
import {
	type SchwabApiConfig,
	getSchwabApiConfigDefaults,
	resolveBaseUrl,
} from './core/config'
import {
	createRequestContext,
	type RequestContext,
	createEndpoint,
	type EndpointMetadata,
	type HttpMethod,
} from './core/http'
import * as errors from './errors'
import {
	SchwabError,
	SchwabApiError,
	SchwabAuthError,
	SchwabRateLimitError,
	SchwabAuthorizationError,
	SchwabInvalidRequestError,
	SchwabNotFoundError,
	SchwabServerError,
	SchwabNetworkError,
	SchwabTimeoutError,
	isSchwabError,
	isSchwabApiError,
	ApiErrorCode,
	AuthErrorCode,
	ErrorResponseSchema,
	parseErrorResponse,
} from './errors'
import * as marketData from './market-data'
import { compose } from './middleware/compose'
import {
	type MiddlewarePipelineOptions,
	buildMiddlewarePipeline,
} from './middleware/pipeline'
import * as schemas from './schemas'
import * as trader from './trader'

/**
 * Options for creating a Schwab API client
 */
export interface CreateApiClientOptions {
	/**
	 * API configuration options
	 * These will be merged with the default configuration
	 */
	config?: Partial<SchwabApiConfig>

	/**
	 * Authentication token, token manager, or auth config
	 *
	 * This can be one of:
	 * - A string containing an access token
	 * - An object implementing ITokenLifecycleManager
	 * - An AuthFactoryConfig object that will be passed to createSchwabAuth
	 *
	 * Concurrency protection is automatically applied for refresh-capable token managers.
	 */
	auth?: string | ITokenLifecycleManager | auth.AuthFactoryConfig

	/**
	 * Middleware configuration options
	 * This provides a flexible way to configure the middleware pipeline
	 *
	 * @example
	 * ```typescript
	 * // Customizing middleware
	 * const client = createApiClient({
	 *   config: { environment: 'SANDBOX' },
	 *   auth: myTokenManager,
	 *   middleware: {
	 *     // Configure specific middleware
	 *     rateLimit: { maxRequests: 60, windowMs: 60000 },
	 *     retry: { maxAttempts: 5, baseDelayMs: 2000 },
	 *
	 *     // Add custom middleware in specific positions
	 *     before: [loggingMiddleware],
	 *     between: {
	 *       authAndRateLimit: [metricsMiddleware]
	 *     },
	 *     custom: [errorReportingMiddleware]
	 *   }
	 * })
	 * ```
	 */
	middleware?: MiddlewarePipelineOptions
}

/**
 * The Schwab API client
 * Contains all namespaces and utilities for interacting with the Schwab API
 */
export interface SchwabApiClient {
	/**
	 * Market Data API (quotes, price history, instruments, etc.)
	 */
	marketData: typeof marketData

	/**
	 * Trader API (accounts, orders, transactions, etc.)
	 */
	trader: typeof trader

	/**
	 * Schemas for API requests and responses
	 */
	schemas: typeof schemas

	/**
	 * Auth utilities and types
	 */
	auth: typeof auth

	/**
	 * Error types and utilities
	 */
	errors: {
		// Base error class
		SchwabError: typeof SchwabError
		isSchwabError: typeof isSchwabError

		// API errors
		SchwabApiError: typeof SchwabApiError
		isSchwabApiError: typeof isSchwabApiError
		SchwabRateLimitError: typeof SchwabRateLimitError
		SchwabAuthorizationError: typeof SchwabAuthorizationError
		SchwabInvalidRequestError: typeof SchwabInvalidRequestError
		SchwabNotFoundError: typeof SchwabNotFoundError
		SchwabServerError: typeof SchwabServerError
		SchwabNetworkError: typeof SchwabNetworkError
		SchwabTimeoutError: typeof SchwabTimeoutError

		// Auth errors
		SchwabAuthError: typeof SchwabAuthError

		// Error codes
		ApiErrorCode: typeof ApiErrorCode
		AuthErrorCode: typeof AuthErrorCode

		// Error parsing
		ErrorResponse: typeof ErrorResponseSchema
		parseErrorResponse: typeof parseErrorResponse
	}

	/**
	 * Request context that can be used with context-aware functions
	 * @internal Exposed for advanced use cases
	 */
	_context: RequestContext

	/**
	 * Unified discovery object that provides direct access to all modules,
	 * types, and utilities in a single structured object. This enables
	 * comprehensive discoverability of all APIs without additional imports.
	 */
	all: {
		/**
		 * Market Data API (quotes, price history, instruments, etc.)
		 */
		marketData: typeof marketData

		/**
		 * Trader API (accounts, orders, transactions, etc.)
		 */
		trader: typeof trader

		/**
		 * Schemas for API requests and responses
		 */
		schemas: typeof schemas

		/**
		 * Auth utilities and types
		 */
		auth: typeof auth

		/**
		 * Complete set of error types and utilities
		 */
		errors: typeof errors
	}

	/**
	 * Create an endpoint function using the shared API client context
	 * This is the recommended way to create API endpoint functions
	 *
	 * @template P - Path parameter type
	 * @template Q - Query parameter type
	 * @template B - Body parameter type
	 * @template R - Response type
	 * @template M - HTTP method
	 * @template E - Error type
	 * @param meta - Endpoint metadata
	 * @returns A function that makes requests to the endpoint
	 */
	createEndpoint<
		P = unknown,
		Q = unknown,
		B = unknown,
		R = unknown,
		M extends HttpMethod = HttpMethod,
		E = unknown,
	>(
		meta: EndpointMetadata<P, Q, B, R, M, E>,
	): ReturnType<typeof createEndpoint<P, Q, B, R, M, E>>
}

/**
 * Creates a configured Schwab API client
 *
 * This is the main entry point for using the Schwab API client library.
 * It provides a consistent approach to middleware configuration
 * and token management.
 *
 * Features enabled by default:
 * - Concurrency-safe token refresh
 * - Rate limiting (120 requests per minute)
 * - Automatic retries (up to 3 times with exponential backoff)
 *
 * @example
 * ```typescript
 * // Example 1: Basic usage with default middleware
 * const client = createApiClient({
 *   config: { environment: 'SANDBOX' },
 *   auth: myTokenManager
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Example 2: Using with OAuth flow (recommended for most apps)
 * const authClient = createSchwabAuthClient({...})
 * const tokenSet = await authClient.exchangeCode(code)
 *
 * // Create a custom refresh provider that implements ITokenLifecycleManager
 * const tokenManager = {
 *   async getTokenData() {
 *     const tokens = await authClient.load() || tokenSet
 *     return {
 *       accessToken: tokens.accessToken,
 *       refreshToken: tokens.refreshToken,
 *       expiresAt: tokens.expiresAt
 *     }
 *   },
 *
 *   async getAccessToken() {
 *     const tokens = await this.getTokenData()
 *     return tokens ? tokens.accessToken : null
 *   },
 *
 *   supportsRefresh() {
 *     return true
 *   },
 *
 *   async refreshIfNeeded() {
 *     const newTokens = await authClient.refreshTokens()
 *     return {
 *       accessToken: newTokens.accessToken,
 *       refreshToken: newTokens.refreshToken,
 *       expiresAt: newTokens.expiresAt
 *     }
 *   },
 *
 *   onRefresh(callback) {
 *     authClient.onRefresh(callback)
 *   }
 * }
 *
 * // Concurrency protection is automatically applied
 * const client = createApiClient({
 *   config: {
 *     environment: 'SANDBOX',
 *     enableLogging: true
 *   },
 *   auth: tokenManager
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Example 3: Customizing middleware
 * const client = createApiClient({
 *   config: { environment: 'SANDBOX' },
 *   auth: myTokenManager,
 *   middleware: {
 *     // Configure specific middleware
 *     rateLimit: { maxRequests: 60, windowMs: 60000 },
 *     retry: { maxAttempts: 5, baseDelayMs: 2000 },
 *
 *     // Add custom middleware in specific positions
 *     before: [loggingMiddleware],
 *     between: {
 *       authAndRateLimit: [metricsMiddleware]
 *     },
 *     custom: [errorReportingMiddleware]
 *   }
 * })
 * ```
 *
 * The middleware execution order follows this specific sequence:
 * 1. `before` middleware (executed first)
 * 2. Authentication middleware (if auth is provided)
 * 3. `between.authAndRateLimit` middleware
 * 4. Rate limiting middleware
 * 5. `between.rateLimitAndRetry` middleware
 * 6. Retry middleware
 * 7. `custom` middleware (executed last)
 */
export function createApiClient(
	options: CreateApiClientOptions = {},
): SchwabApiClient {
	// Merge provided config with defaults
	const rawConfig = {
		...getSchwabApiConfigDefaults(),
		...options.config,
	}

	// Ensure baseUrl is consistent with environment if not explicitly provided
	const finalConfig: SchwabApiConfig = {
		...rawConfig,
		// Only set baseUrl if not explicitly provided in options.config
		...(options.config?.baseUrl ? {} : { baseUrl: resolveBaseUrl(rawConfig) }),
	}

	// Get the token manager from auth parameter
	let tokenManager: unknown

	// Handle auth parameter
	if (options.auth !== undefined) {
		if (
			typeof options.auth === 'string' ||
			auth.isTokenLifecycleManager(options.auth)
		) {
			// String token or token manager object
			tokenManager = options.auth
		} else {
			// AuthFactoryConfig - create a token manager using the auth factory
			tokenManager = auth.createSchwabAuth(options.auth)
		}
	}

	// Build the middleware pipeline
	const middlewares = buildMiddlewarePipeline(
		options.middleware || {},
		tokenManager as string | ITokenLifecycleManager | undefined,
	)

	// Compose the middleware chain
	const chain = compose(...middlewares)

	// Fetch function is now passed explicitly via context

	// Create a request context with config and fetch function
	const context = createRequestContext(finalConfig, (req) => chain(req))

	// Return the API client with all namespaces and helper functions
	return {
		marketData,
		trader,
		schemas,
		auth,
		errors: {
			// Base error class
			SchwabError,
			isSchwabError,

			// API errors
			SchwabApiError,
			isSchwabApiError,
			SchwabRateLimitError,
			SchwabAuthorizationError,
			SchwabInvalidRequestError,
			SchwabNotFoundError,
			SchwabServerError,
			SchwabNetworkError,
			SchwabTimeoutError,

			// Auth errors
			SchwabAuthError,

			// Error codes
			ApiErrorCode,
			AuthErrorCode,

			// Error parsing
			ErrorResponse: ErrorResponseSchema,
			parseErrorResponse,
		},

		// Expose the context for advanced use cases
		_context: context,

		// Factory function to create endpoint functions using the shared context
		createEndpoint: <P, Q, B, R, M extends HttpMethod, E>(
			meta: EndpointMetadata<P, Q, B, R, M, E>,
		) => createEndpoint(context, meta),

		// Unified discovery object for comprehensive API access
		all: {
			marketData,
			trader,
			schemas,
			auth,
			errors,
		},
	}
}
