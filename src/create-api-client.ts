import * as authNs from './auth'
import {
	type AuthDiagnosticsOptions,
	type AuthDiagnosticsResult,
} from './auth/auth-diagnostics'
import { type EnhancedTokenManager } from './auth/enhanced-token-manager'
import {
	type SchwabApiConfig,
	getSchwabApiConfigDefaults,
	// resolveBaseUrl, // Not directly used in the provided snippet modification
} from './core/config'
import { type ProcessNamespaceResult } from './core/endpoint-types'
import {
	createRequestContext,
	type RequestContext,
	createEndpoint as coreHttpCreateEndpoint, // Aliased import
	type EndpointMetadata,
	type HttpMethod,
} from './core/http'
import * as errorsNs from './errors'
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
import * as marketDataNs from './market-data'
import { compose } from './middleware/compose'
import {
	type MiddlewarePipelineOptions,
	buildMiddlewarePipeline,
} from './middleware/pipeline'
import * as schemasNs from './schemas'
import * as traderNs from './trader'

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
	 * - An EnhancedTokenManager instance
	 * - An AuthFactoryConfig object that will be passed to createSchwabAuth
	 *
	 * Concurrency protection is automatically applied for refresh-capable token managers.
	 */
	auth?: string | EnhancedTokenManager | authNs.AuthFactoryConfig

	/**
	 * Middleware configuration options
	 * This provides a flexible way to configure the middleware pipeline
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
	 * These namespaces contain both the metadata objects (with 'Meta' suffix) and
	 * the actual endpoint functions (without 'Meta' suffix) that are created during client initialization.
	 */
	marketData: ProcessNamespaceResult<typeof marketDataNs>

	/**
	 * Trader API (accounts, orders, transactions, etc.)
	 * These namespaces contain both the metadata objects (with 'Meta' suffix) and
	 * the actual endpoint functions (without 'Meta' suffix) that are created during client initialization.
	 */
	trader: ProcessNamespaceResult<typeof traderNs>

	/**
	 * Schemas for API requests and responses
	 */
	schemas: typeof schemasNs

	/**
	 * Auth utilities and types
	 */
	auth: typeof authNs

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
	 * Unified discovery object
	 * Contains all APIs, schemas, auth utilities, and error types in a single object.
	 * The marketData and trader namespaces contain both metadata objects and
	 * callable endpoint functions created during client initialization.
	 */
	all: {
		marketData: ProcessNamespaceResult<typeof marketDataNs>
		trader: ProcessNamespaceResult<typeof traderNs>
		schemas: typeof schemasNs
		auth: typeof authNs
		errors: typeof errorsNs
	}

	/**
	 * Create an endpoint function using the shared API client context
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
	): ReturnType<typeof coreHttpCreateEndpoint<P, Q, B, R, M, E>>

	/**
	 * Debug authentication issues and provide detailed information about the current auth state.
	 * Use this when experiencing 401 Unauthorized errors to diagnose token problems.
	 * @param options Options for debugging auth
	 * @returns Detailed diagnostics information about the auth state
	 */
	debugAuth(options?: AuthDiagnosticsOptions): Promise<AuthDiagnosticsResult>
}

/**
 * Helper function to recursively process namespaces and convert Meta objects to endpoints
 * Uses the ProcessNamespaceResult type to maintain proper typing of the result
 */
function processNamespace<T extends Record<string, any>>(
	ns: T,
	clientCreateEndpoint: (
		meta: EndpointMetadata<any, any, any, any, any, any>,
	) => any,
): ProcessNamespaceResult<T> {
	// Process the namespace and return a properly typed result
	const result: any = {}

	// First pass - process all Meta objects and prepare for endpoint creation
	const endpointsToCreate: {
		[key: string]: EndpointMetadata<any, any, any, any, any, any>
	} = {}

	for (const key in ns) {
		if (Object.prototype.hasOwnProperty.call(ns, key)) {
			const value = ns[key]
			if (typeof value === 'object' && value !== null) {
				// Check if it's likely an EndpointMetadata object exported from an endpoints module
				// It should have properties like 'method' and 'path', and we're looking for a 'Meta' suffix.
				// Also ensure it's not a sub-namespace object that could also contain such properties.
				// A simple check for 'method' and 'path' and key ending with 'Meta' is a heuristic.
				if (
					key.endsWith('Meta') &&
					'method' in value &&
					'path' in value &&
					!Object.values(value).some(
						(v) =>
							typeof v === 'object' &&
							v !== null &&
							'method' in v &&
							'path' in v,
					)
				) {
					const endpointName = key.substring(0, key.length - 'Meta'.length)
					endpointsToCreate[endpointName] = value as EndpointMetadata

					// Also keep the original Meta object
					result[key] = value
				} else {
					// Recursively process sub-namespaces (like 'quotes' within 'marketData')
					result[key] = processNamespace(value, clientCreateEndpoint)
				}
			} else {
				// Copy other properties (functions like extractQuoteErrors, primitives, etc.) as is
				result[key] = value
			}
		}
	}

	// Second pass - create all endpoints
	for (const [endpointName, meta] of Object.entries(endpointsToCreate)) {
		result[endpointName] = clientCreateEndpoint(meta)
	}

	// Cast the result to the expected type
	// This maintains type safety while allowing the actual implementation to be dynamic
	return result as ProcessNamespaceResult<T>
}

export function createApiClient(
	options: CreateApiClientOptions = {},
): SchwabApiClient {
	const finalConfig = { ...getSchwabApiConfigDefaults(), ...options.config }

	let authManager: EnhancedTokenManager

	if (typeof options.auth === 'string') {
		// This path makes createApiClient inherently async.
		// For synchronous init, this path should not be taken.
		throw new Error(
			'createApiClient with a string token is an async operation and not supported in this synchronous path. Please provide an EnhancedTokenManager instance.',
		)
	} else if (options.auth && 'strategy' in options.auth) {
		// This path is also async because createSchwabAuth could be async or ETM setup could be.
		throw new Error(
			'createApiClient with AuthFactoryConfig is an async operation and not supported in this synchronous path. Please provide an EnhancedTokenManager instance.',
		)
	} else if (options.auth instanceof authNs.EnhancedTokenManager) {
		authManager = options.auth
	} else {
		// Default to a simple EnhancedTokenManager with no tokens
		authManager = new authNs.EnhancedTokenManager({
			clientId: 'dummy-client-sync',
			clientSecret: 'dummy-secret-sync',
			redirectUri: 'https://example.com/callback-sync',
		})
		const loggerToUse = finalConfig.logger || console
		loggerToUse.warn(
			'Schwab API Client (sync): No ETM auth instance provided. Using a dummy token manager. API calls will likely fail until a real ETM is configured or OAuth flow completes.',
		)
	}

	const middlewareConfig = options.middleware ?? {}
	// Call the synchronous buildMiddlewarePipeline, ensuring authManager is an ETM instance
	const middleware = buildMiddlewarePipeline(middlewareConfig, authManager)
	const chain = compose(...middleware)
	const apiClientContext = createRequestContext(finalConfig, (req) =>
		chain(req),
	)

	const clientBoundCreateEndpoint = function <
		P,
		Q,
		B,
		R,
		M extends HttpMethod,
		E,
	>(
		meta: EndpointMetadata<P, Q, B, R, M, E>,
	): ReturnType<typeof coreHttpCreateEndpoint<P, Q, B, R, M, E>> {
		return coreHttpCreateEndpoint(apiClientContext, meta)
	}

	const processedMarketData = processNamespace(
		marketDataNs,
		clientBoundCreateEndpoint,
	)
	const processedTrader = processNamespace(traderNs, clientBoundCreateEndpoint)

	const client: SchwabApiClient = {
		marketData: processedMarketData,
		trader: processedTrader,
		schemas: schemasNs,
		auth: authNs,
		errors: {
			SchwabError,
			isSchwabError,
			SchwabApiError,
			isSchwabApiError,
			SchwabRateLimitError,
			SchwabAuthorizationError,
			SchwabInvalidRequestError,
			SchwabNotFoundError,
			SchwabServerError,
			SchwabNetworkError,
			SchwabTimeoutError,
			SchwabAuthError,
			ApiErrorCode,
			AuthErrorCode,
			ErrorResponse: ErrorResponseSchema,
			parseErrorResponse,
		},
		_context: apiClientContext,
		createEndpoint: clientBoundCreateEndpoint,
		all: {
			marketData: processedMarketData,
			trader: processedTrader,
			schemas: schemasNs,
			auth: authNs,
			errors: errorsNs,
		},
		debugAuth: async (debugOptions = {}) => {
			// Ensure authManager is the one associated with this client instance
			const currentAuthManager = authManager // Capture from closure
			const { logger } = apiClientContext
			logger.info('[debugAuth] Starting auth diagnostics')

			try {
				// Use the new getDiagnostics method from EnhancedTokenManager
				const diagnostics =
					await currentAuthManager.getDiagnostics(debugOptions)

				// Log diagnostics summary for troubleshooting
				logger.info('[debugAuth] Auth diagnostics complete:', {
					authManagerType: diagnostics.authManagerType,
					supportsRefresh: diagnostics.supportsRefresh,
					hasAccessToken: diagnostics.tokenStatus.hasAccessToken,
					hasRefreshToken: diagnostics.tokenStatus.hasRefreshToken,
					isExpired: diagnostics.tokenStatus.isExpired,
					expiresInSeconds: diagnostics.tokenStatus.expiresInSeconds,
					apiEnvironment: diagnostics.environment.apiEnvironment,
				})

				return diagnostics
			} catch (error) {
				logger.error('[debugAuth] Error during diagnostics:', error)

				// Return error information in a consistent format
				return {
					authManagerType: authManager.constructor.name,
					supportsRefresh: authManager.supportsRefresh(),
					tokenStatus: {
						hasAccessToken: false,
						hasRefreshToken: false,
						isExpired: true,
						errorMessage:
							error instanceof Error ? error.message : String(error),
						diagnosticsError: true,
					},
					environment: {
						apiEnvironment: finalConfig.environment,
					},
				} as AuthDiagnosticsResult
			}
		},
	}

	return client
}
