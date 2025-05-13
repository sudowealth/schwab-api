import { ZodType, ZodTypeDef } from 'zod'
import { SchwabApiError } from './errors'

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
> {
	method: M
	path: string // Can include path parameters like /path/:id
	pathSchema?: ZodType<PType, ZodTypeDef, any> // Schema that outputs PType
	querySchema?: ZodType<QType, ZodTypeDef, any> // Schema that outputs QType
	bodySchema?: ZodType<BType, ZodTypeDef, any> // Schema that outputs BType
	responseSchema: ZodType<RType, ZodTypeDef, any> // Schema that outputs RType
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

export interface SchwabApiConfig {
	baseUrl?: string // default https://api.schwabapi.com
	environment?: 'sandbox' | 'production'
	enableLogging?: boolean
}

// Default API configuration
const DEFAULT_API_CONFIG: SchwabApiConfig = {
	baseUrl: 'https://api.schwabapi.com',
	environment: 'production',
	enableLogging: false, // Default to false for a library, user can enable
}

// Sandbox API configuration
export const SANDBOX_API_CONFIG: SchwabApiConfig = {
	baseUrl: 'https://api-sandbox.schwabapi.com',
	environment: 'sandbox',
	enableLogging: true,
}

// Active configuration, initialized with defaults
let apiConfig: SchwabApiConfig = { ...DEFAULT_API_CONFIG }

export function configureSchwabApi(cfg: Partial<SchwabApiConfig>): void {
	apiConfig = {
		...DEFAULT_API_CONFIG, // Start with base defaults
		...apiConfig, // Apply current configuration
		...cfg, // Override with new settings
	}
	if (apiConfig.enableLogging) {
		console.log('[Schwab API Client] Configured:', apiConfig)
	}
}

export function getSchwabApiConfig(): Readonly<SchwabApiConfig> {
	return apiConfig
}

// Fully implemented schwabFetch
export async function schwabFetch<P, Q, B, R, M extends HttpMethod>(
	accessToken: string | null, // Null for public endpoints
	endpoint: EndpointMetadata<P, Q, B, R, M>,
	options?: SchwabFetchRequestOptions<P, Q, B>,
): Promise<R> {
	const config = getSchwabApiConfig()
	if (config.enableLogging) {
		console.log(
			`[Schwab API Client] Requesting: ${endpoint.method} ${endpoint.path}`,
			{ endpoint, options },
		)
	}

	if (!endpoint.isPublic && !accessToken) {
		throw new SchwabApiError(
			401,
			undefined,
			`[schwabFetch] Access token is required for non-public endpoint ${endpoint.method} ${endpoint.path}`,
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
	} = endpoint

	// Validate Path Parameters
	let validatedPathParams = pathParams
	if (pathSchema) {
		const parsed = pathSchema.safeParse(pathParams ?? {})
		if (!parsed.success) {
			throw new SchwabApiError(
				400,
				parsed.error.format(),
				`[schwabFetch] Invalid path parameters for ${method} ${endpointTemplate}`,
			)
		}
		validatedPathParams = parsed.data as P
	} else if (
		pathParams &&
		Object.keys(pathParams).length > 0 &&
		config.enableLogging
	) {
		console.warn(
			`[schwabFetch] Path parameters provided for ${method} ${endpointTemplate}, but no pathSchema is defined.`,
		)
	}

	// Validate Query Parameters
	let validatedQueryParams = queryParams
	if (querySchema) {
		const parsed = querySchema.safeParse(queryParams ?? {})
		if (!parsed.success) {
			throw new SchwabApiError(
				400,
				parsed.error.format(),
				`[schwabFetch] Invalid query parameters for ${method} ${endpointTemplate}`,
			)
		}
		validatedQueryParams = parsed.data as Q
	} else if (
		queryParams &&
		Object.keys(queryParams).length > 0 &&
		config.enableLogging
	) {
		console.warn(
			`[schwabFetch] Query parameters provided for ${method} ${endpointTemplate}, but no querySchema is defined.`,
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
			throw new SchwabApiError(
				400,
				parsed.error.format(),
				`[schwabFetch] Invalid request body for ${method} ${endpointTemplate}`,
			)
		}
		validatedBody = parsed.data as B
	} else if (body && config.enableLogging) {
		console.warn(
			`[schwabFetch] Request body provided for ${method} ${endpointTemplate}, but no bodySchema is defined.`,
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

	if (config.enableLogging) {
		console.log(`[Schwab API Client] Fetching URL: ${url.toString()}`, {
			requestInit,
		})
	}

	try {
		const response = await fetch(url.toString(), requestInit)

		if (config.enableLogging) {
			console.log(
				`[Schwab API Client] Response status: ${response.status} for ${method} ${endpointTemplate}`,
			)
		}

		if (!response.ok) {
			let errorBody
			try {
				errorBody = await response.json()
			} catch (e) {
				if (config.enableLogging) {
					console.warn(
						`[schwabFetch] Could not parse error response body as JSON for ${method} ${endpointTemplate}`,
						e,
					)
				}
				errorBody = await response.text()
			}
			throw new SchwabApiError(
				response.status,
				errorBody,
				`[schwabFetch] API Error for ${method} ${endpointTemplate}: ${response.statusText}`,
			)
		}

		// Handle cases like 204 No Content
		if (
			response.status === 204 ||
			response.headers.get('content-length') === '0'
		) {
			if (config.enableLogging) {
				console.log(
					`[Schwab API Client] Empty response body for ${method} ${endpointTemplate}.`,
				)
			}
			// Assuming Zod schema for response can handle undefined or an empty object
			// For `z.void()` or `z.undefined()` this will work.
			// For `z.object({})` it should also be fine if the API truly returns nothing.
			// Adjust if specific non-empty "empty" responses are expected.
			return undefined as R
		}

		const responseData = await response.json()

		if (config.enableLogging) {
			console.log(
				`[Schwab API Client] Response data for ${method} ${endpointTemplate}:`,
				responseData,
			)
		}

		const parsedResponse = responseSchema.safeParse(responseData)
		if (!parsedResponse.success) {
			throw new SchwabApiError(
				500, // Internal error type, as API returned success but data shape is wrong
				parsedResponse.error.format(),
				`[schwabFetch] Invalid response data structure for ${method} ${endpointTemplate}`,
			)
		}

		return parsedResponse.data as R
	} catch (error) {
		if (config.enableLogging) {
			console.error(
				`[Schwab API Client] Fetch failed for ${method} ${endpointTemplate}:`,
				error,
			)
		}
		if (error instanceof SchwabApiError) {
			throw error
		}
		// Wrap unknown errors
		throw new SchwabApiError(
			500,
			error instanceof Error ? error.message : String(error),
			`[schwabFetch] Unexpected error during fetch for ${method} ${endpointTemplate}`,
		)
	}
}

export function createEndpoint<
	P,
	Q,
	B,
	R,
	M extends HttpMethod,
	Meta extends EndpointMetadata<P, Q, B, R, M>,
>(meta: Meta) {
	return (
		accessToken: string,
		options: SchwabFetchRequestOptions<P, Q, B> = {},
	): Promise<R> => {
		if (!meta.isPublic && !accessToken) {
			throw new SchwabApiError(
				401,
				undefined,
				'Access token is required for this endpoint.',
			)
		}
		const tokenToUse = meta.isPublic ? null : accessToken
		return schwabFetch<P, Q, B, R, M>(tokenToUse, meta, options)
	}
}

// Specific function for public endpoints (kept from schwab-api-client, ensures accessToken is null)
export function createPublicEndpoint<P, Q, B, R, M extends HttpMethod>(
	meta: Omit<EndpointMetadata<P, Q, B, R, M>, 'isPublic'> & { isPublic: true },
): (opts?: SchwabFetchRequestOptions<P, Q, B>) => Promise<R> {
	return (opts?: SchwabFetchRequestOptions<P, Q, B>): Promise<R> => {
		return schwabFetch(null, meta, opts)
	}
}

// --- URL Builder (from MCP, adapted) ---
function buildUrl(
	endpointTemplate: string,
	pathParams?: Record<string, string | number> | undefined,
	queryParams?: Record<string, any> | undefined,
): URL {
	const config = getSchwabApiConfig() // Use the getter to ensure consistent config access
	// 1. Substitute Path Parameters
	let finalEndpointPath = endpointTemplate
	if (pathParams) {
		Object.entries(pathParams).forEach(([key, value]) => {
			const placeholder = `{${key}}`
			if (finalEndpointPath.includes(placeholder)) {
				finalEndpointPath = finalEndpointPath.replace(
					new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'), 'g'), // Escape regex special chars
					String(value),
				)
			} else {
				if (config.enableLogging) {
					console.warn(
						`[buildUrl] Path parameter '${key}' provided but not found in template '${endpointTemplate}'`,
					)
				}
			}
		})
	}

	// Check for unsubstituted placeholders after attempting substitution
	// Regex to find patterns like {param_name}
	const placeholderRegex = /\\{[^\\}]+\\}/g
	if (placeholderRegex.test(finalEndpointPath)) {
		throw new SchwabApiError(
			400,
			undefined,
			`[buildUrl] Unsubstituted placeholders remain in path: ${finalEndpointPath}. Check if all required path parameters were provided.`,
		)
	}

	// 2. Construct URL with query parameters
	const baseUrl = config.baseUrl || DEFAULT_API_CONFIG.baseUrl // Fallback if baseUrl is somehow unset
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
	if (config.enableLogging) {
		// Gated log
		console.log(`[buildUrl] Constructed URL: ${url.toString()}`)
	}
	return url
}
