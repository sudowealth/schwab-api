import { type ZodType, type ZodTypeDef } from 'zod'
import { type Middleware, compose } from '../middleware/compose'
import { type SchwabApiConfig, getSchwabApiConfigDefaults } from './config'
import {
	SchwabApiError,
	SchwabAuthorizationError,
	SchwabInvalidRequestError,
	SchwabServerError,
	createSchwabApiError,
} from './errors'

// Thread-local client instance fetch handler (will be set by create-api-client)
let threadLocalFetch: ((req: Request) => Promise<Response>) | null = null

// Thread-local configuration (will be set by create-api-client)
let threadLocalConfig: SchwabApiConfig | null = null

// Context management functions for internal use only
export function setThreadLocalFetch(
	fetchFn: (req: Request) => Promise<Response>,
): void {
	threadLocalFetch = fetchFn
}

export function setThreadLocalConfig(config: SchwabApiConfig): void {
	threadLocalConfig = config
}

// Global fetch handler that will be used as a fallback
export const globalFetch = fetch

export { type Middleware, compose }

export type HttpMethod =
	| 'GET'
	| 'POST'
	| 'PUT'
	| 'DELETE'
	| 'PATCH'
	| 'OPTIONS'
	| 'HEAD'

export type InferPathParams<S> = S extends ZodType<infer P> ? P : undefined
export type InferQueryParams<S> = S extends ZodType<infer Q> ? Q : undefined
export type InferBody<S> = S extends ZodType<infer B> ? B : undefined
export type InferResponse<S> = S extends ZodType<infer R> ? R : undefined

export interface EndpointMetadata<
	PType = unknown, // Inferred type for path params
	QType = unknown, // Inferred type for query params
	BType = unknown, // Inferred type for body
	RType = unknown, // Inferred type for response
	M extends HttpMethod = HttpMethod, // Allow broader HttpMethod from MCP
	ErrorType = unknown, // Error response type
> {
	method: M
	path: string // Can include path parameters like /path/:id
	pathSchema?: ZodType<PType, ZodTypeDef, any> // Schema that outputs PType
	querySchema?: ZodType<QType, ZodTypeDef, any> // Schema that outputs QType
	bodySchema?: ZodType<BType, ZodTypeDef, any> // Schema that outputs BType
	responseSchema: ZodType<RType, ZodTypeDef, any> // Schema that outputs RType
	errorSchema?: ZodType<ErrorType, ZodTypeDef, any> // Schema for error responses
	isPublic?: boolean // Indicates if the endpoint requires auth
	description?: string
}

// Placeholder for SchwabFetchRequestOptions (to be defined)
export interface SchwabFetchRequestOptions<
	P = unknown,
	Q = unknown,
	B = unknown,
> {
	pathParams?: P
	queryParams?: Q
	body?: B
	headers?: Record<string, string>
	init?: Omit<RequestInit, 'body' | 'method'>
}

/**
 * Get the effective API configuration
 * This will prioritize thread-local configuration over default configuration
 */
export function getEffectiveConfig(): SchwabApiConfig {
	return threadLocalConfig || getSchwabApiConfigDefaults()
}

// Utility function for logging
function log(
	level: 'debug' | 'info' | 'warn' | 'error',
	message: string,
	data?: any,
) {
	const config = getEffectiveConfig()
	if (!config.enableLogging) return

	const logLevels = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
		none: 4,
	}

	// Only log if the current level is sufficient
	if (logLevels[level] >= logLevels[config.logLevel]) {
		if (data !== undefined && level === 'debug') {
			console[level](message, data)
		} else {
			console[level](message)
		}
	}
}

// Utility function to handle API errors
function handleApiError(
	error: unknown,
	context: string,
	endpoint?: string,
): never {
	if (error instanceof SchwabApiError) throw error

	const status =
		error instanceof Error && 'status' in error ? (error as any).status : 500

	throw createSchwabApiError(
		status,
		error,
		`${context}: ${error instanceof Error ? error.message : String(error)}`,
	)
}

// Fully implemented schwabFetch
export async function schwabFetch<
	P,
	Q,
	B,
	R,
	M extends HttpMethod,
	E = unknown,
>(
	accessToken: string | null, // Null for public endpoints
	endpoint: EndpointMetadata<P, Q, B, R, M, E>,
	options?: SchwabFetchRequestOptions<P, Q, B>,
): Promise<R> {
	const config = getEffectiveConfig()
	log('info', `Requesting: ${endpoint.method} ${endpoint.path}`)
	log('debug', 'Request details:', { endpoint, options })

	if (!endpoint.isPublic && !accessToken) {
		throw new SchwabAuthorizationError(
			undefined,
			`Access token is required for non-public endpoint ${endpoint.method} ${endpoint.path}`,
		)
	}

	const { pathParams, queryParams, body, init = {} } = options ?? {}
	const {
		path: endpointTemplate,
		method,
		pathSchema,
		querySchema,
		bodySchema,
		responseSchema,
		errorSchema,
	} = endpoint

	// Validate Path Parameters
	let validatedPathParams = pathParams
	if (pathSchema) {
		const parsed = pathSchema.safeParse(pathParams ?? {})
		if (!parsed.success) {
			throw new SchwabInvalidRequestError(
				parsed.error.format(),
				`Invalid path parameters for ${method} ${endpointTemplate}`,
			)
		}
		validatedPathParams = parsed.data as P
	} else if (pathParams && Object.keys(pathParams).length > 0) {
		log(
			'warn',
			`Path parameters provided for ${method} ${endpointTemplate}, but no pathSchema is defined.`,
		)
	}

	// Validate Query Parameters
	let validatedQueryParams = queryParams
	if (querySchema) {
		const parsed = querySchema.safeParse(queryParams ?? {})
		if (!parsed.success) {
			throw new SchwabInvalidRequestError(
				parsed.error.format(),
				`Invalid query parameters for ${method} ${endpointTemplate}`,
			)
		}
		validatedQueryParams = parsed.data as Q
	} else if (queryParams && Object.keys(queryParams).length > 0) {
		log(
			'warn',
			`Query parameters provided for ${method} ${endpointTemplate}, but no querySchema is defined.`,
		)
	}

	const url = buildUrl(
		endpointTemplate,
		validatedPathParams as Record<string, string | number> | undefined,
		validatedQueryParams as Record<string, any> | undefined,
	)

	// Validate Body
	let validatedBody = body
	if (bodySchema) {
		const parsed = bodySchema.safeParse(body ?? {}) // Allow undefined body if schema supports it
		if (!parsed.success) {
			throw new SchwabInvalidRequestError(
				parsed.error.format(),
				`Invalid request body for ${method} ${endpointTemplate}`,
			)
		}
		validatedBody = parsed.data as B
	} else if (body) {
		log(
			'warn',
			`Request body provided for ${method} ${endpointTemplate}, but no bodySchema is defined.`,
		)
	}

	const headers: Record<string, string> = {
		...(options?.headers ?? {}), // User-provided headers
		Accept: 'application/json',
		...(accessToken && !endpoint.isPublic
			? { Authorization: `Bearer ${accessToken}` }
			: {}),
	}

	const requestInit: RequestInit = {
		...init,
		method,
		headers,
	}

	if (
		validatedBody !== undefined &&
		(method === 'POST' || method === 'PUT' || method === 'PATCH')
	) {
		requestInit.body = JSON.stringify(validatedBody)
		headers['Content-Type'] = 'application/json'
	}

	log('debug', `Fetching URL: ${url.toString()}`, { requestInit })

	try {
		// Use thread-local fetch if available, otherwise fall back to global fetch
		const fetchFunction = threadLocalFetch || globalFetch

		// Add timeout support
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), config.timeout)

		const response = await fetchFunction(
			new Request(url.toString(), {
				...requestInit,
				signal: controller.signal,
			}),
		)

		// Clear the timeout
		clearTimeout(timeoutId)

		log(
			'info',
			`Response status: ${response.status} for ${method} ${endpointTemplate}`,
		)

		if (!response.ok) {
			let errorBody
			try {
				errorBody = await response.json()

				// If we have an error schema, validate the error response
				if (errorSchema) {
					const parsedError = errorSchema.safeParse(errorBody)
					if (parsedError.success) {
						errorBody = parsedError.data
					}
				}
			} catch (e) {
				log(
					'warn',
					`Could not parse error response body as JSON for ${method} ${endpointTemplate}`,
					e,
				)
				errorBody = await response.text()
			}

			throw createSchwabApiError(
				response.status,
				errorBody,
				`API Error for ${method} ${endpointTemplate}: ${response.statusText}`,
			)
		}

		// Handle cases like 204 No Content
		if (
			response.status === 204 ||
			response.headers.get('content-length') === '0'
		) {
			log('info', `Empty response body for ${method} ${endpointTemplate}.`)
			return undefined as R
		}

		const responseData = await response.json()
		log(
			'debug',
			`Response data for ${method} ${endpointTemplate}:`,
			responseData,
		)

		const parsedResponse = responseSchema.safeParse(responseData)
		if (!parsedResponse.success) {
			throw new SchwabServerError(
				parsedResponse.error.format(),
				`Invalid response data structure for ${method} ${endpointTemplate}`,
			)
		}

		return parsedResponse.data as R
	} catch (error) {
		// Handle AbortError separately
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new SchwabApiError(
				408, // Request Timeout
				{ message: 'Request timed out' },
				`Request timeout after ${config.timeout}ms for ${method} ${endpointTemplate}`,
			)
		}

		log('error', `Fetch failed for ${method} ${endpointTemplate}:`, error)

		if (error instanceof SchwabApiError) {
			throw error
		}

		// Wrap unknown errors
		handleApiError(
			error,
			`Unexpected error during fetch for ${method} ${endpointTemplate}`,
			`${method} ${endpointTemplate}`,
		)
	}
}

export function createEndpoint<P, Q, B, R, M extends HttpMethod, E = unknown>(
	meta: EndpointMetadata<P, Q, B, R, M, E>,
) {
	return (
		accessToken: string,
		options: SchwabFetchRequestOptions<P, Q, B> = {},
	): Promise<R> => {
		if (!meta.isPublic && !accessToken) {
			throw new SchwabAuthorizationError(
				undefined,
				'Access token is required for this endpoint.',
			)
		}
		const tokenToUse = meta.isPublic ? null : accessToken
		return schwabFetch<P, Q, B, R, M, E>(tokenToUse, meta, options)
	}
}

// Specific function for public endpoints
export function createPublicEndpoint<
	P,
	Q,
	B,
	R,
	M extends HttpMethod,
	E = unknown,
>(
	meta: Omit<EndpointMetadata<P, Q, B, R, M, E>, 'isPublic'> & {
		isPublic: true
	},
): (opts?: SchwabFetchRequestOptions<P, Q, B>) => Promise<R> {
	return (opts?: SchwabFetchRequestOptions<P, Q, B>): Promise<R> => {
		return schwabFetch<P, Q, B, R, M, E>(null, meta, opts)
	}
}

// --- URL Builder ---
export function buildUrl(
	endpointTemplate: string,
	pathParams?: Record<string, string | number> | undefined,
	queryParams?: Record<string, any> | undefined,
): URL {
	const config = getEffectiveConfig()

	// 1. Substitute Path Parameters
	let finalEndpointPath = endpointTemplate
	if (pathParams) {
		Object.entries(pathParams).forEach(([key, value]) => {
			const curlyPlaceholder = `{${key}}`
			const colonPlaceholderPattern = new RegExp(`:${key}(?=\\/|\\.|$)`, 'g') // Matches :key followed by /, ., or EOL

			let replaced = false
			if (finalEndpointPath.includes(curlyPlaceholder)) {
				// Properly escape the curly braces for regex replacement
				const escapedPlaceholder = curlyPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
				finalEndpointPath = finalEndpointPath.replace(
					new RegExp(escapedPlaceholder, 'g'),
					String(value),
				)
				replaced = true
			}

			// Check and replace colon-style placeholders separately
			if (colonPlaceholderPattern.test(finalEndpointPath)) {
				finalEndpointPath = finalEndpointPath.replace(
					colonPlaceholderPattern,
					String(value),
				)
				replaced = true
			}

			if (!replaced) {
				log(
					'warn',
					`Path parameter '${key}' provided but not found in template '${endpointTemplate}'`,
				)
			}
		})
	}

	// Check for unsubstituted placeholders after substitution
	const unsubstitutedCurlyPlaceholderRegex = /\{[^\}]+\}/g
	const unsubstitutedColonPlaceholderRegex = /:[a-zA-Z0-9_]+(?=\/|\.|_|$)/g

	const curlyMatches = finalEndpointPath.match(
		unsubstitutedCurlyPlaceholderRegex,
	)
	const colonMatches = finalEndpointPath.match(
		unsubstitutedColonPlaceholderRegex,
	)

	if (curlyMatches || colonMatches) {
		const remainingCurly = curlyMatches ? curlyMatches.join(', ') : 'none'
		const remainingColon = colonMatches ? colonMatches.join(', ') : 'none'
		throw new SchwabInvalidRequestError(
			undefined,
			`Unsubstituted placeholders remain in path: ${finalEndpointPath}. Check if all required path parameters were provided. Remaining (curly): ${remainingCurly}. Remaining (colon): ${remainingColon}.`,
		)
	}

	// 2. Construct URL with versioning and query parameters
	const baseUrl = config.baseUrl

	// Add API version to path if not already present
	if (
		!finalEndpointPath.startsWith(`/${config.apiVersion}/`) &&
		!finalEndpointPath.includes(`/${config.apiVersion}/`)
	) {
		finalEndpointPath = `/${config.apiVersion}${finalEndpointPath}`
	}

	const url = new URL(baseUrl + finalEndpointPath)

	if (queryParams) {
		Object.entries(queryParams).forEach(([key, value]) => {
			if (value !== undefined) {
				if (Array.isArray(value)) {
					value.forEach((v) => url.searchParams.append(key, String(v)))
				} else {
					url.searchParams.set(key, String(value))
				}
			}
		})
	}

	log('debug', `Constructed URL: ${url.toString()}`)
	return url
}