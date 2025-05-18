import * as authNs from './auth'
import { type ITokenLifecycleManager } from './auth/token-lifecycle-manager'
import {
	type SchwabApiConfig,
	getSchwabApiConfigDefaults,
	// resolveBaseUrl, // Not directly used in the provided snippet modification
} from './core/config'
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
	 * - An object implementing ITokenLifecycleManager
	 * - An AuthFactoryConfig object that will be passed to createSchwabAuth
	 *
	 * Concurrency protection is automatically applied for refresh-capable token managers.
	 */
	auth?: string | ITokenLifecycleManager | authNs.AuthFactoryConfig

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
	 * Type will be transformed from marketDataNs
	 */
	marketData: any // Placeholder type, to be refined

	/**
	 * Trader API (accounts, orders, transactions, etc.)
	 * Type will be transformed from traderNs
	 */
	trader: any // Placeholder type, to be refined

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
	 */
	all: {
		marketData: any // Placeholder type
		trader: any // Placeholder type
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
}

// Helper function to recursively process namespaces and convert Meta objects to endpoints
function processNamespace<T extends Record<string, any>>(
	ns: T,
	clientCreateEndpoint: (
		meta: EndpointMetadata<any, any, any, any, any, any>,
	) => any,
): any {
	// Consider a more specific return type if possible, e.g., Processed<T>
	const result: any = {}
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
					result[endpointName] = clientCreateEndpoint(value as EndpointMetadata)
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
	return result
}

export function createApiClient(
	options: CreateApiClientOptions = {},
): SchwabApiClient {
	const finalConfig = { ...getSchwabApiConfigDefaults(), ...options.config }

	let authManager: ITokenLifecycleManager
	if (typeof options.auth === 'string') {
		const auth = authNs.createSchwabAuth({
			strategy: authNs.AuthStrategy.STATIC,
			accessToken: options.auth,
		})
		// Cast to ensure type compatibility (all FullAuthClient implements ITokenLifecycleManager properties)
		authManager = auth as unknown as ITokenLifecycleManager
	} else if (options.auth && 'strategy' in options.auth) {
		const auth = authNs.createSchwabAuth(
			options.auth as authNs.AuthFactoryConfig,
		)
		// Cast to ensure type compatibility
		authManager = auth as unknown as ITokenLifecycleManager
	} else if (options.auth) {
		authManager = options.auth as ITokenLifecycleManager
	} else {
		// Default to a simple static token manager if no auth provided
		const auth = authNs.createSchwabAuth({
			strategy: authNs.AuthStrategy.STATIC,
			accessToken: '',
		})
		// Cast to ensure type compatibility
		authManager = auth as unknown as ITokenLifecycleManager
		console.warn(
			'Schwab API Client: No authentication strategy provided. Using a dummy token manager. API calls will likely fail.',
		)
	}

	const middlewareConfig = options.middleware ?? {}
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
	}

	return client
}
