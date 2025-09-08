import {
	SchwabAuthError,
	AuthErrorCode,
	SchwabApiError,
	ApiErrorCode,
} from '../errors.js'

/**
 * Result of error mapping operation
 */
export interface ErrorMappingResult {
	/**
	 * Mapped error code
	 */
	code: AuthErrorCode | ApiErrorCode

	/**
	 * Human-readable error message
	 */
	message: string

	/**
	 * HTTP status code to use in response
	 */
	httpStatus: number

	/**
	 * Whether the error is retryable
	 */
	isRetryable: boolean

	/**
	 * Whether reauthentication is required
	 */
	requiresReauth: boolean

	/**
	 * Additional context about the error
	 */
	context?: Record<string, any>
}

/**
 * Interface for custom error mappers
 */
export interface ErrorMapper {
	/**
	 * Map an error to a result
	 */
	map(error: unknown): ErrorMappingResult | null
}

/**
 * Enhanced error mapper with extensible mapping support
 */
export class SchwabErrorMapper {
	private customMappers: ErrorMapper[] = []
	private authErrorMappings: Map<AuthErrorCode, Partial<ErrorMappingResult>> =
		new Map()
	private apiErrorMappings: Map<ApiErrorCode, Partial<ErrorMappingResult>> =
		new Map()

	constructor(options?: {
		customMappers?: ErrorMapper[]
		customAuthMappings?: Record<AuthErrorCode, Partial<ErrorMappingResult>>
		customApiMappings?: Record<ApiErrorCode, Partial<ErrorMappingResult>>
	}) {
		// Initialize default mappings
		this.initializeDefaultMappings()

		// Add custom mappers
		if (options?.customMappers) {
			this.customMappers.push(...options.customMappers)
		}

		// Override auth mappings
		if (options?.customAuthMappings) {
			Object.entries(options.customAuthMappings).forEach(([code, mapping]) => {
				this.authErrorMappings.set(code as AuthErrorCode, mapping)
			})
		}

		// Override API mappings
		if (options?.customApiMappings) {
			Object.entries(options.customApiMappings).forEach(([code, mapping]) => {
				this.apiErrorMappings.set(code as ApiErrorCode, mapping)
			})
		}
	}

	/**
	 * Initialize default error mappings
	 */
	private initializeDefaultMappings(): void {
		// Auth error mappings
		this.authErrorMappings.set(AuthErrorCode.INVALID_CODE, {
			message: 'Invalid or expired authorization code',
			httpStatus: 400,
			isRetryable: false,
			requiresReauth: true,
		})

		this.authErrorMappings.set(AuthErrorCode.TOKEN_EXPIRED, {
			message: 'Refresh token has expired',
			httpStatus: 401,
			isRetryable: false,
			requiresReauth: true,
		})

		this.authErrorMappings.set(AuthErrorCode.UNAUTHORIZED, {
			message: 'Invalid client credentials',
			httpStatus: 401,
			isRetryable: false,
			requiresReauth: true,
		})

		this.authErrorMappings.set(AuthErrorCode.REFRESH_NEEDED, {
			message: 'Access token needs refresh',
			httpStatus: 401,
			isRetryable: true,
			requiresReauth: false,
		})

		this.authErrorMappings.set(AuthErrorCode.NETWORK, {
			message: 'Network error during authentication',
			httpStatus: 503,
			isRetryable: true,
			requiresReauth: false,
		})

		this.authErrorMappings.set(AuthErrorCode.TOKEN_PERSISTENCE_LOAD_FAILED, {
			message: 'Failed to load stored tokens',
			httpStatus: 500,
			isRetryable: true,
			requiresReauth: false,
		})

		this.authErrorMappings.set(AuthErrorCode.TOKEN_PERSISTENCE_SAVE_FAILED, {
			message: 'Failed to save tokens',
			httpStatus: 500,
			isRetryable: true,
			requiresReauth: false,
		})

		this.authErrorMappings.set(AuthErrorCode.TOKEN_VALIDATION_ERROR, {
			message: 'Token validation failed',
			httpStatus: 401,
			isRetryable: false,
			requiresReauth: true,
		})

		this.authErrorMappings.set(AuthErrorCode.PKCE_VERIFIER_MISSING, {
			message: 'PKCE code verifier is missing',
			httpStatus: 400,
			isRetryable: false,
			requiresReauth: true,
		})

		// API error mappings
		this.apiErrorMappings.set(ApiErrorCode.RATE_LIMIT, {
			message: 'Rate limit exceeded',
			httpStatus: 429,
			isRetryable: true,
			requiresReauth: false,
		})

		this.apiErrorMappings.set(ApiErrorCode.UNAUTHORIZED, {
			message: 'Unauthorized API access',
			httpStatus: 401,
			isRetryable: false,
			requiresReauth: true,
		})

		this.apiErrorMappings.set(ApiErrorCode.FORBIDDEN, {
			message: 'Access forbidden',
			httpStatus: 403,
			isRetryable: false,
			requiresReauth: false,
		})

		this.apiErrorMappings.set(ApiErrorCode.NOT_FOUND, {
			message: 'Resource not found',
			httpStatus: 404,
			isRetryable: false,
			requiresReauth: false,
		})

		this.apiErrorMappings.set(ApiErrorCode.SERVER_ERROR, {
			message: 'Internal server error',
			httpStatus: 500,
			isRetryable: true,
			requiresReauth: false,
		})

		this.apiErrorMappings.set(ApiErrorCode.SERVICE_UNAVAILABLE, {
			message: 'Service temporarily unavailable',
			httpStatus: 503,
			isRetryable: true,
			requiresReauth: false,
		})

		this.apiErrorMappings.set(ApiErrorCode.GATEWAY_ERROR, {
			message: 'Gateway error',
			httpStatus: 502,
			isRetryable: true,
			requiresReauth: false,
		})

		this.apiErrorMappings.set(ApiErrorCode.TIMEOUT, {
			message: 'Request timeout',
			httpStatus: 408,
			isRetryable: true,
			requiresReauth: false,
		})

		this.apiErrorMappings.set(ApiErrorCode.NETWORK, {
			message: 'Network error',
			httpStatus: 0,
			isRetryable: true,
			requiresReauth: false,
		})
	}

	/**
	 * Map a Schwab error to an error mapping result
	 */
	map(error: unknown): ErrorMappingResult {
		// Try custom mappers first
		for (const mapper of this.customMappers) {
			const result = mapper.map(error)
			if (result) {
				return result
			}
		}

		// Handle SchwabAuthError
		if (error instanceof SchwabAuthError) {
			return this.mapAuthError(error)
		}

		// Handle SchwabApiError
		if (error instanceof SchwabApiError) {
			return this.mapApiError(error)
		}

		// Default mapping for unknown errors
		return {
			code: ApiErrorCode.UNKNOWN,
			message: error instanceof Error ? error.message : 'Unknown error',
			httpStatus: 500,
			isRetryable: false,
			requiresReauth: false,
		}
	}

	/**
	 * Map an auth error
	 */
	mapAuthError(error: SchwabAuthError): ErrorMappingResult {
		const baseMapping = this.authErrorMappings.get(error.code) || {}

		return {
			code: error.code,
			message: baseMapping.message || error.message,
			httpStatus: baseMapping.httpStatus || error.status || 500,
			isRetryable: baseMapping.isRetryable ?? error.isRetryable(),
			requiresReauth: baseMapping.requiresReauth ?? true,
			context: {
				originalMessage: error.message,
				...(error.body ? { body: error.body } : {}),
			},
		}
	}

	/**
	 * Map an API error
	 */
	mapApiError(error: SchwabApiError): ErrorMappingResult {
		const baseMapping = this.apiErrorMappings.get(error.code) || {}

		return {
			code: error.code,
			message: baseMapping.message || error.getFormattedDetails(),
			httpStatus: baseMapping.httpStatus || error.status,
			isRetryable: baseMapping.isRetryable ?? error.isRetryable(),
			requiresReauth: baseMapping.requiresReauth ?? error.status === 401,
			context: {
				originalMessage: error.message,
				requestId: error.getRequestId(),
				...(error.metadata && { metadata: error.metadata }),
			},
		}
	}

	/**
	 * Add a custom error mapper
	 */
	addMapper(mapper: ErrorMapper): void {
		this.customMappers.push(mapper)
	}

	/**
	 * Override a specific auth error mapping
	 */
	setAuthMapping(
		code: AuthErrorCode,
		mapping: Partial<ErrorMappingResult>,
	): void {
		this.authErrorMappings.set(code, mapping)
	}

	/**
	 * Override a specific API error mapping
	 */
	setApiMapping(
		code: ApiErrorCode,
		mapping: Partial<ErrorMappingResult>,
	): void {
		this.apiErrorMappings.set(code, mapping)
	}
}

/**
 * Default error mapper instance
 */
export const defaultErrorMapper = new SchwabErrorMapper()

/**
 * Map a Schwab SDK error to appropriate error metadata
 * This is a convenience function that uses the default mapper
 */
export function mapSchwabError(error: unknown): ErrorMappingResult {
	return defaultErrorMapper.map(error)
}

/**
 * Create an error handler function for Express/Hono style frameworks
 */
export function schwabErrorHandler(options?: {
	includeStackTrace?: boolean
	customMapper?: SchwabErrorMapper
}) {
	const mapper = options?.customMapper || defaultErrorMapper

	return (error: unknown, _req: any, res: any) => {
		const mapping = mapper.map(error)

		const response = {
			error: {
				code: mapping.code,
				message: mapping.message,
				...(mapping.context?.requestId && {
					requestId: mapping.context.requestId,
				}),
			},
			...(options?.includeStackTrace &&
				error instanceof Error && {
					stack: error.stack,
				}),
		}

		// Set appropriate headers
		if (mapping.context?.requestId) {
			res.setHeader('X-Request-ID', mapping.context.requestId)
		}

		res.status(mapping.httpStatus).json(response)
	}
}

/**
 * Check if an error requires reauthentication
 */
export function requiresReauthentication(error: unknown): boolean {
	const mapping = defaultErrorMapper.map(error)
	return mapping.requiresReauth
}

/**
 * Get retry information from an error
 */
export function getRetryInfo(error: unknown): {
	isRetryable: boolean
	retryAfterMs?: number
} {
	const mapping = defaultErrorMapper.map(error)

	const result: { isRetryable: boolean; retryAfterMs?: number } = {
		isRetryable: mapping.isRetryable,
	}

	// Check for retry-after information in API errors
	if (error instanceof SchwabApiError && error.hasRetryInfo()) {
		const retryDelay = error.getRetryDelayMs()
		if (retryDelay !== null) {
			result.retryAfterMs = retryDelay
		}
	}

	return result
}
