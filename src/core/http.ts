import { type ZodType, type ZodTypeDef } from 'zod'
import {
	SchwabApiError,
	createSchwabApiError,
	handleApiError,
	extractErrorMetadata,
} from '../errors'
import {
	type SchwabApiConfig,
	getSchwabApiConfigDefaults,
	resolveBaseUrl,
} from './config'

// Global fetch handler that will be used as a fallback
const globalFetch = fetch

export type HttpMethod =
	| 'GET'
	| 'POST'
	| 'PUT'
	| 'DELETE'
	| 'PATCH'
	| 'OPTIONS'
	| 'HEAD'

export interface EndpointMetadata<
	PType = unknown, // Inferred type for path params
	QType = unknown, // Inferred type for query params
	BType = unknown, // Inferred type for body
	RType = unknown, // Inferred type for response
	M extends HttpMethod = HttpMethod, // Allow broader HttpMethod from MCP
	ErrorType = unknown, // Error response type
> {
	method: M
	path: string // Can include path parameters like /path/{id}
	pathSchema?: ZodType<PType, ZodTypeDef, any> // Schema that outputs PType
	querySchema?: ZodType<QType, ZodTypeDef, any> // Schema that outputs QType
	bodySchema?: ZodType<BType, ZodTypeDef, any> // Schema that outputs BType
	responseSchema: ZodType<RType, ZodTypeDef, any> // Schema that outputs RType
	errorSchema?: ZodType<ErrorType, ZodTypeDef, any> // Schema for error responses
	description?: string
}

// Options for API requests
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

// Request context containing config and fetch function
export interface RequestContext {
	config: SchwabApiConfig
	fetchFn: (req: Request) => Promise<Response>
}

/**
 * Create a new request context with the given config and fetch function
 */
export function createRequestContext(
	config: SchwabApiConfig = getSchwabApiConfigDefaults(),
	fetchFn: (req: Request) => Promise<Response> = globalFetch,
): RequestContext {
	return {
		config,
		fetchFn,
	}
}

// Utility function for logging
function log(
	context: RequestContext,
	level: 'debug' | 'info' | 'warn' | 'error',
	message: string,
	data?: any,
) {
	const { config } = context
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

/**
 * Primary implementation for making API requests
 * All API requests should use this function
 */
async function schwabFetchWithContext<
        P,
        Q,
        B,
        R,
        M extends HttpMethod,
        E = unknown,
>(
        context: RequestContext,
        endpoint: EndpointMetadata<P, Q, B, R, M, E>,
        options?: SchwabFetchRequestOptions<P, Q, B>,
): Promise<R> {
        const { config, fetchFn } = context
        log(context, 'info', `Requesting: ${endpoint.method} ${endpoint.path}`)
        log(context, 'debug', 'Request details:', { endpoint, options })

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
			// Format the validation errors into a more readable message
			const errors = parsed.error.format()
			let validationDetails = ''

			// Try to extract specific field validation errors
			try {
				const errorEntries = Object.entries(errors)
					.filter(([key]) => key !== '_errors')
					.map(([key, value]) => {
						if (
							typeof value === 'object' &&
							'_errors' in value &&
							Array.isArray(value._errors)
						) {
							return `'${key}': ${value._errors.join(', ')}`
						}
						return null
					})
					.filter(Boolean)

				if (errorEntries.length > 0) {
					validationDetails = ` - Validation errors: ${errorEntries.join('; ')}`
				}
			} catch (e) {
				// If error formatting fails, just use the default message
				log(context, 'warn', 'Failed to format validation errors', e)
			}

			throw createSchwabApiError(
				400,
				parsed.error.format(),
				`Invalid path parameters for ${method} ${endpointTemplate}${validationDetails}`,
			)
		}
		validatedPathParams = parsed.data as P
	} else if (pathParams && Object.keys(pathParams).length > 0) {
		log(
			context,
			'warn',
			`Path parameters provided for ${method} ${endpointTemplate}, but no pathSchema is defined.`,
		)
	}

	// Validate Query Parameters
	let validatedQueryParams = queryParams
	if (querySchema) {
		const parsed = querySchema.safeParse(queryParams ?? {})
		if (!parsed.success) {
			// Format the validation errors into a more readable message
			const errors = parsed.error.format()
			let validationDetails = ''

			// Try to extract specific field validation errors
			try {
				const errorEntries = Object.entries(errors)
					.filter(([key]) => key !== '_errors')
					.map(([key, value]) => {
						if (
							typeof value === 'object' &&
							'_errors' in value &&
							Array.isArray(value._errors)
						) {
							return `'${key}': ${value._errors.join(', ')}`
						}
						return null
					})
					.filter(Boolean)

				if (errorEntries.length > 0) {
					validationDetails = ` - Validation errors: ${errorEntries.join('; ')}`
				}
			} catch (e) {
				// If error formatting fails, just use the default message
				log(context, 'warn', 'Failed to format validation errors', e)
			}

			throw createSchwabApiError(
				400,
				parsed.error.format(),
				`Invalid query parameters for ${method} ${endpointTemplate}${validationDetails}`,
			)
		}
		validatedQueryParams = parsed.data as Q
	} else if (queryParams && Object.keys(queryParams).length > 0) {
		log(
			context,
			'warn',
			`Query parameters provided for ${method} ${endpointTemplate}, but no querySchema is defined.`,
		)
	}

	const url = buildUrlWithContext(
		context,
		endpointTemplate,
		validatedPathParams as Record<string, string | number> | undefined,
		validatedQueryParams as Record<string, any> | undefined,
	)

	// Validate Body
	let validatedBody = body
	if (bodySchema) {
		const parsed = bodySchema.safeParse(body ?? {}) // Allow undefined body if schema supports it
		if (!parsed.success) {
			// Format the validation errors into a more readable message
			const errors = parsed.error.format()
			let validationDetails = ''

			// Try to extract specific field validation errors
			try {
				const errorEntries = Object.entries(errors)
					.filter(([key]) => key !== '_errors')
					.map(([key, value]) => {
						if (
							typeof value === 'object' &&
							'_errors' in value &&
							Array.isArray(value._errors)
						) {
							return `'${key}': ${value._errors.join(', ')}`
						}
						return null
					})
					.filter(Boolean)

				if (errorEntries.length > 0) {
					validationDetails = ` - Validation errors: ${errorEntries.join('; ')}`
				}
			} catch (e) {
				// If error formatting fails, just use the default message
				log(context, 'warn', 'Failed to format validation errors', e)
			}

			throw createSchwabApiError(
				400,
				parsed.error.format(),
				`Invalid request body for ${method} ${endpointTemplate}${validationDetails}`,
			)
		}
		validatedBody = parsed.data as B
	} else if (body) {
		log(
			context,
			'warn',
			`Request body provided for ${method} ${endpointTemplate}, but no bodySchema is defined.`,
		)
	}

        const headers: Record<string, string> = {
                ...(options?.headers ?? {}), // User-provided headers
                Accept: 'application/json',
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

	log(context, 'debug', `Fetching URL: ${url.toString()}`, { requestInit })

	try {
		// Add timeout support
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), config.timeout)

		const response = await fetchFn(
			new Request(url.toString(), {
				...requestInit,
				signal: controller.signal,
			}),
		)

		// Clear the timeout
		clearTimeout(timeoutId)

		log(
			context,
			'info',
			`Response status: ${response.status} for ${method} ${endpointTemplate}`,
		)

		if (!response.ok) {
			let errorBody
			// Clone the response before attempting to read its body
			const responseClone = response.clone()
			try {
				errorBody = await response.json()

				// If we have an endpoint-specific error schema, validate against that first
				if (errorSchema) {
					const parsedError = errorSchema.safeParse(errorBody)
					if (parsedError.success) {
						errorBody = parsedError.data
					}
				}
			} catch (e) {
				log(
					context,
					'warn',
					`Could not parse error response body as JSON for ${method} ${endpointTemplate}`,
					e,
				)
				// Use the cloned response for the fallback attempt
				errorBody = await responseClone.text()
			}

			// Prepare a more detailed error message
			let detailedErrorMessage = `API Error for ${method} ${endpointTemplate}: ${response.statusText}`

			// Add query parameters to error message for debugging
			if (
				validatedQueryParams &&
				Object.keys(validatedQueryParams).length > 0
			) {
				detailedErrorMessage += ` - Query params: ${JSON.stringify(validatedQueryParams)}`
			}

			// Extract metadata from response headers for better error handling
			const metadata = extractErrorMetadata(response)

			// Create an error with the appropriate type and structured details
			// parseErrorResponse is called inside createSchwabApiError to populate the parsedError field
			throw createSchwabApiError(
				response.status,
				errorBody,
				detailedErrorMessage,
				metadata,
			)
		}

		// Handle cases like 204 No Content
		if (
			response.status === 204 ||
			response.headers.get('content-length') === '0'
		) {
			log(
				context,
				'info',
				`Empty response body for ${method} ${endpointTemplate}.`,
			)
			return undefined as R
		}

		const responseData = await response.json()
		log(
			context,
			'debug',
			`Response data for ${method} ${endpointTemplate}:`,
			responseData,
		)

		const parsedResponse = responseSchema.safeParse(responseData)
		if (!parsedResponse.success) {
			const SENSITIVE_MAX_ERROR_LENGTH = 500 // To avoid overly long messages
			const validationErrors = JSON.stringify(
				parsedResponse.error.format(),
				null,
				2,
			)
			const truncatedErrors =
				validationErrors.length > SENSITIVE_MAX_ERROR_LENGTH
					? validationErrors.substring(0, SENSITIVE_MAX_ERROR_LENGTH) +
						'... (truncated)'
					: validationErrors

			throw createSchwabApiError(
				500,
				parsedResponse.error.format(),
				`Invalid response data structure for ${method} ${endpointTemplate}. Validation errors: ${truncatedErrors}`,
			)
		}

		return parsedResponse.data as R
	} catch (error) {
		// Handle AbortError separately
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw createSchwabApiError(
				408, // Request Timeout
				{ message: 'Request timed out' },
				`Request timeout after ${config.timeout}ms for ${method} ${endpointTemplate}`,
			)
		}

		log(
			context,
			'error',
			`Fetch failed for ${method} ${endpointTemplate}:`,
			error,
		)

		if (error instanceof SchwabApiError) {
			throw error
		}

		// Wrap unknown errors
		handleApiError(
			error,
			`Unexpected error during fetch for ${method} ${endpointTemplate}`,
		)
	}
}

/**
 * Create an endpoint function using the provided context
 * This is the primary way to create API endpoint functions
 */
export function createEndpoint<P, Q, B, R, M extends HttpMethod, E = unknown>(
        context: RequestContext,
        meta: EndpointMetadata<P, Q, B, R, M, E>,
) {
        return (
                options: SchwabFetchRequestOptions<P, Q, B> = {},
        ): Promise<R> => {
                return schwabFetchWithContext<P, Q, B, R, M, E>(
                        context,
                        meta,
                        options,
                )
        }
}

/**
 * Build a URL for an API endpoint with the provided context
 */
function buildUrlWithContext(
	context: RequestContext,
	endpointTemplate: string,
	pathParams?: Record<string, string | number> | undefined,
	queryParams?: Record<string, any> | undefined,
): URL {
	const { config } = context

	// 1. Substitute Path Parameters
	let finalEndpointPath = endpointTemplate
	if (pathParams) {
		Object.entries(pathParams).forEach(([key, value]) => {
			const curlyPlaceholder = `{${key}}`
			const colonPlaceholderPattern = new RegExp(`:${key}(?=\\/|\\.|$)`, 'g') // Matches :key followed by /, ., or EOL

			let replaced = false
			if (finalEndpointPath.includes(curlyPlaceholder)) {
				// Properly escape the curly braces for regex replacement
				const escapedPlaceholder = curlyPlaceholder.replace(
					/[.*+?^${}()|[\]\\]/g,
					'\\$&',
				)
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
					context,
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
		throw createSchwabApiError(
			400,
			undefined,
			`Unsubstituted placeholders remain in path: ${finalEndpointPath}. Check if all required path parameters were provided. Remaining (curly): ${remainingCurly}. Remaining (colon): ${remainingColon}.`,
		)
	}

	// 2. Use the centralized base URL resolution
	// This ensures consistent URL resolution across the codebase
	const baseUrl = resolveBaseUrl(config)

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

	log(context, 'debug', `Constructed URL: ${url.toString()}`)
	return url
}
