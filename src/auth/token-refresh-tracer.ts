import { type TokenData } from './types'

/**
 * Options for token refresh tracing
 */
export interface TokenRefreshTracerOptions {
	/**
	 * Whether to include the raw HTTP responses in the trace
	 * WARNING: This will include sensitive token data
	 * @default false
	 */
	includeRawResponses?: boolean

	/**
	 * Custom callback function for handling trace events
	 * If provided, logs will be sent to this function instead of console
	 */
	tracerCallback?: ((event: TokenRefreshTraceEvent) => void) | undefined

	/**
	 * Add additional context information to trace events
	 */
	additionalContext?: Record<string, any>

	/**
	 * Maximum number of events to keep in history
	 * @default 10
	 */
	maxHistorySize?: number
}

/**
 * Types of token refresh trace events
 */
export enum TokenRefreshEventType {
	REFRESH_STARTED = 'refresh_started',
	REFRESH_HTTP_REQUEST = 'refresh_http_request',
	REFRESH_HTTP_RESPONSE = 'refresh_http_response',
	REFRESH_SUCCEEDED = 'refresh_succeeded',
	REFRESH_FAILED = 'refresh_failed',
	TOKEN_VALIDATION = 'token_validation',
	TOKEN_USED = 'token_used',
	TOKEN_SAVE = 'token_save',
	TOKEN_LOAD = 'token_load',
}

/**
 * Token refresh trace event structure
 */
export interface TokenRefreshTraceEvent {
	/**
	 * Unique ID for the refresh operation
	 */
	refreshId: string

	/**
	 * Timestamp when the event occurred
	 */
	timestamp: string

	/**
	 * Type of trace event
	 */
	eventType: TokenRefreshEventType

	/**
	 * Additional details specific to the event type
	 */
	details: {
		/**
		 * For HTTP requests: URL, method, headers (sanitized)
		 * For HTTP responses: status, headers, partial body (sanitized)
		 * For token events: token status (sanitized)
		 */
		[key: string]: any
	}

	/**
	 * Error information if applicable
	 */
	error?: {
		message: string
		name: string
		stack?: string
		code?: string
		status?: number
	}

	/**
	 * Additional context information
	 */
	context?: Record<string, any>
}

/**
 * Singleton token refresh tracer class
 * Provides detailed tracing of token refresh operations
 */
export class TokenRefreshTracer {
	private static instance: TokenRefreshTracer
	private options: {
		includeRawResponses: boolean
		tracerCallback?: (event: TokenRefreshTraceEvent) => void
		additionalContext: Record<string, any>
		maxHistorySize: number
	}
	private traceHistory: TokenRefreshTraceEvent[] = []
	private activeRefreshId: string | null = null

	private constructor(options: TokenRefreshTracerOptions = {}) {
		this.options = {
			includeRawResponses: options.includeRawResponses || false,
			tracerCallback: options.tracerCallback,
			additionalContext: options.additionalContext || {},
			maxHistorySize: options.maxHistorySize || 10,
		}
	}

	/**
	 * Get the singleton instance of the tracer
	 */
	public static getInstance(
		options?: TokenRefreshTracerOptions,
	): TokenRefreshTracer {
		if (!TokenRefreshTracer.instance) {
			TokenRefreshTracer.instance = new TokenRefreshTracer(options)
		} else if (options) {
			// Update options if provided
			TokenRefreshTracer.instance.updateOptions(options)
		}

		return TokenRefreshTracer.instance
	}

	/**
	 * Update tracer options
	 */
	public updateOptions(options: Partial<TokenRefreshTracerOptions>): void {
		this.options = {
			includeRawResponses:
				options.includeRawResponses ?? this.options.includeRawResponses,
			tracerCallback: options.tracerCallback ?? this.options.tracerCallback,
			maxHistorySize: options.maxHistorySize ?? this.options.maxHistorySize,
			additionalContext: {
				...this.options.additionalContext,
				...(options.additionalContext || {}),
			},
		}
	}

	/**
	 * Start tracing a new token refresh operation
	 */
	public startRefreshTrace(): string {
		const refreshId = `refresh-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
		this.activeRefreshId = refreshId

		this.recordEvent({
			refreshId,
			timestamp: new Date().toISOString(),
			eventType: TokenRefreshEventType.REFRESH_STARTED,
			details: {
				startedAt: new Date().toISOString(),
			},
			context: this.options.additionalContext,
		})

		return refreshId
	}

	/**
	 * Record an HTTP request for token refresh
	 */
	public recordRefreshRequest(
		refreshId: string | null,
		url: string,
		method: string,
		headers: Record<string, string>,
		body?: any,
	): void {
		refreshId = refreshId || this.activeRefreshId
		if (!refreshId) return

		// Sanitize headers to remove sensitive information
		const sanitizedHeaders = this.sanitizeHeaders(headers)

		// Sanitize body for token requests
		let sanitizedBody: any = undefined
		if (body) {
			if (typeof body === 'string' && body.includes('refresh_token')) {
				// For URL encoded form data
				const params = new URLSearchParams(body)
				sanitizedBody = {}
				params.forEach((value, key) => {
					if (key === 'refresh_token') {
						sanitizedBody[key] = value.substring(0, 8) + '...'
					} else if (key === 'client_secret') {
						sanitizedBody[key] = '[REDACTED]'
					} else {
						sanitizedBody[key] = value
					}
				})
			} else if (typeof body === 'object') {
				// For JSON objects
				sanitizedBody = { ...body }
				if (sanitizedBody.refresh_token) {
					sanitizedBody.refresh_token =
						sanitizedBody.refresh_token.substring(0, 8) + '...'
				}
				if (sanitizedBody.client_secret) {
					sanitizedBody.client_secret = '[REDACTED]'
				}
			}
		}

		this.recordEvent({
			refreshId,
			timestamp: new Date().toISOString(),
			eventType: TokenRefreshEventType.REFRESH_HTTP_REQUEST,
			details: {
				url,
				method,
				headers: sanitizedHeaders,
				body: sanitizedBody,
			},
			context: this.options.additionalContext,
		})
	}

	/**
	 * Record an HTTP response from token refresh
	 */
	public recordRefreshResponse(
		refreshId: string | null,
		status: number,
		headers: Record<string, string>,
		body: any,
	): void {
		refreshId = refreshId || this.activeRefreshId
		if (!refreshId) return

		// Sanitize the response body to avoid logging sensitive data
		let sanitizedBody: any

		if (typeof body === 'object' && body !== null) {
			sanitizedBody = { ...body }

			// Redact sensitive token information
			if (sanitizedBody.access_token) {
				sanitizedBody.access_token =
					sanitizedBody.access_token.substring(0, 8) + '...'
			}
			if (sanitizedBody.refresh_token) {
				sanitizedBody.refresh_token =
					sanitizedBody.refresh_token.substring(0, 8) + '...'
			}

			// Include raw response if explicitly enabled
			if (!this.options.includeRawResponses) {
				sanitizedBody._note =
					'Set includeRawResponses:true to see full response'
			}
		} else if (typeof body === 'string') {
			// Try to parse as JSON
			try {
				const jsonBody = JSON.parse(body)
				sanitizedBody = { ...jsonBody }

				if (sanitizedBody.access_token) {
					sanitizedBody.access_token =
						sanitizedBody.access_token.substring(0, 8) + '...'
				}
				if (sanitizedBody.refresh_token) {
					sanitizedBody.refresh_token =
						sanitizedBody.refresh_token.substring(0, 8) + '...'
				}
			} catch (e) {
				// Not JSON, sanitize if it contains token data
				if (body.includes('access_token') || body.includes('refresh_token')) {
					sanitizedBody = '[SENSITIVE RESPONSE - REDACTED]'
				} else {
					sanitizedBody =
						body.length > 100 ? body.substring(0, 100) + '...' : body
				}
				console.error('Error sanitizing body', e)
			}
		} else {
			sanitizedBody = body
		}

		this.recordEvent({
			refreshId,
			timestamp: new Date().toISOString(),
			eventType: TokenRefreshEventType.REFRESH_HTTP_RESPONSE,
			details: {
				status,
				headers: this.sanitizeHeaders(headers),
				body: sanitizedBody,
				rawIncluded: this.options.includeRawResponses,
			},
			context: this.options.additionalContext,
		})
	}

	/**
	 * Record successful token refresh
	 */
	public recordRefreshSuccess(
		refreshId: string | null,
		tokenData: Partial<TokenData>,
	): void {
		refreshId = refreshId || this.activeRefreshId
		if (!refreshId) return

		// Sanitize token data to avoid logging sensitive information
		const sanitizedTokenData = {
			hasAccessToken: !!tokenData.accessToken,
			accessTokenSegment: tokenData.accessToken
				? tokenData.accessToken.substring(0, 8) + '...'
				: undefined,
			hasRefreshToken: !!tokenData.refreshToken,
			refreshTokenSegment: tokenData.refreshToken
				? tokenData.refreshToken.substring(0, 8) + '...'
				: undefined,
			expiresAt: tokenData.expiresAt,
			expiresIn: tokenData.expiresAt
				? Math.floor((tokenData.expiresAt - Date.now()) / 1000) + 's'
				: undefined,
		}

		this.recordEvent({
			refreshId,
			timestamp: new Date().toISOString(),
			eventType: TokenRefreshEventType.REFRESH_SUCCEEDED,
			details: {
				tokenData: sanitizedTokenData,
				completedAt: new Date().toISOString(),
			},
			context: this.options.additionalContext,
		})

		// If this is the active refresh, clear it
		if (refreshId === this.activeRefreshId) {
			this.activeRefreshId = null
		}
	}

	/**
	 * Record failed token refresh
	 */
	public recordRefreshFailure(
		refreshId: string | null,
		error: Error | unknown,
	): void {
		refreshId = refreshId || this.activeRefreshId
		if (!refreshId) return

		// Create a structured error object
		const errorObj =
			error instanceof Error
				? {
						message: error.message,
						name: error.name,
						stack: error.stack,
						code: (error as any).code,
						status: (error as any).status,
					}
				: {
						message: String(error),
						name: 'Unknown Error',
					}

		this.recordEvent({
			refreshId,
			timestamp: new Date().toISOString(),
			eventType: TokenRefreshEventType.REFRESH_FAILED,
			details: {
				failedAt: new Date().toISOString(),
			},
			error: errorObj,
			context: this.options.additionalContext,
		})

		// If this is the active refresh, clear it
		if (refreshId === this.activeRefreshId) {
			this.activeRefreshId = null
		}
	}

	/**
	 * Record token validation event
	 */
	public recordTokenValidation(
		isValid: boolean,
		tokenData: Partial<TokenData>,
		reason?: string,
	): void {
		// Sanitize token data
		const sanitizedTokenData = {
			hasAccessToken: !!tokenData.accessToken,
			accessTokenSegment: tokenData.accessToken
				? tokenData.accessToken.substring(0, 8) + '...'
				: undefined,
			hasRefreshToken: !!tokenData.refreshToken,
			expiresAt: tokenData.expiresAt,
			expiresIn: tokenData.expiresAt
				? Math.floor((tokenData.expiresAt - Date.now()) / 1000) + 's'
				: undefined,
			isExpired: tokenData.expiresAt
				? tokenData.expiresAt <= Date.now()
				: undefined,
		}

		this.recordEvent({
			refreshId: 'validation-' + Date.now(),
			timestamp: new Date().toISOString(),
			eventType: TokenRefreshEventType.TOKEN_VALIDATION,
			details: {
				isValid,
				reason,
				tokenData: sanitizedTokenData,
			},
			context: this.options.additionalContext,
		})
	}

	/**
	 * Record token being used for an API request
	 */
	public recordTokenUsed(
		url: string,
		method: string,
		tokenSegment: string,
	): void {
		this.recordEvent({
			refreshId: 'usage-' + Date.now(),
			timestamp: new Date().toISOString(),
			eventType: TokenRefreshEventType.TOKEN_USED,
			details: {
				url,
				method,
				tokenSegment,
			},
			context: this.options.additionalContext,
		})
	}

	/**
	 * Record token save operation
	 */
	public recordTokenSave(success: boolean, error?: Error | unknown): void {
		const event: TokenRefreshTraceEvent = {
			refreshId: 'save-' + Date.now(),
			timestamp: new Date().toISOString(),
			eventType: TokenRefreshEventType.TOKEN_SAVE,
			details: {
				success,
				timestamp: new Date().toISOString(),
			},
			context: this.options.additionalContext,
		}

		if (error) {
			event.error =
				error instanceof Error
					? {
							message: error.message,
							name: error.name,
							stack: error.stack,
						}
					: {
							message: String(error),
							name: 'Unknown Error',
						}
		}

		this.recordEvent(event)
	}

	/**
	 * Record token load operation
	 */
	public recordTokenLoad(
		success: boolean,
		result?: { hasTokens: boolean },
		error?: Error | unknown,
	): void {
		const event: TokenRefreshTraceEvent = {
			refreshId: 'load-' + Date.now(),
			timestamp: new Date().toISOString(),
			eventType: TokenRefreshEventType.TOKEN_LOAD,
			details: {
				success,
				hasTokens: result?.hasTokens,
				timestamp: new Date().toISOString(),
			},
			context: this.options.additionalContext,
		}

		if (error) {
			event.error =
				error instanceof Error
					? {
							message: error.message,
							name: error.name,
							stack: error.stack,
						}
					: {
							message: String(error),
							name: 'Unknown Error',
						}
		}

		this.recordEvent(event)
	}

	/**
	 * Get the trace history
	 */
	public getTraceHistory(): TokenRefreshTraceEvent[] {
		return [...this.traceHistory]
	}

	/**
	 * Clear the trace history
	 */
	public clearTraceHistory(): void {
		this.traceHistory = []
	}

	/**
	 * Get detailed report of the most recent token refresh
	 */
	public getLatestRefreshReport(): {
		events: TokenRefreshTraceEvent[]
		summary: {
			refreshId: string
			startTime: string
			endTime: string
			duration: number
			success: boolean
			httpRequestCount: number
			statusCode?: number
			errorMessage?: string
		} | null
	} {
		// Find the most recent refresh operation
		const refreshStartEvent = this.traceHistory
			.filter((e) => e.eventType === TokenRefreshEventType.REFRESH_STARTED)
			.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			)
			.shift()

		if (!refreshStartEvent) {
			return { events: [], summary: null }
		}

		const refreshId = refreshStartEvent.refreshId
		const eventsForRefresh = this.traceHistory
			.filter((e) => e.refreshId === refreshId)
			.sort(
				(a, b) =>
					new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
			)

		// Get start and end times
		const startTime = refreshStartEvent.timestamp

		// Find the end event - either success or failure
		const endEvent = eventsForRefresh.find(
			(e) =>
				e.eventType === TokenRefreshEventType.REFRESH_SUCCEEDED ||
				e.eventType === TokenRefreshEventType.REFRESH_FAILED,
		)

		const endTime = endEvent?.timestamp || new Date().toISOString()
		const duration = new Date(endTime).getTime() - new Date(startTime).getTime()

		// Count HTTP requests
		const httpRequestCount = eventsForRefresh.filter(
			(e) => e.eventType === TokenRefreshEventType.REFRESH_HTTP_REQUEST,
		).length

		// Get response status code if available
		const responseEvent = eventsForRefresh.find(
			(e) => e.eventType === TokenRefreshEventType.REFRESH_HTTP_RESPONSE,
		)

		const statusCode = responseEvent?.details?.status

		// Determine success
		const success = eventsForRefresh.some(
			(e) => e.eventType === TokenRefreshEventType.REFRESH_SUCCEEDED,
		)

		// Get error message if failed
		const failEvent = eventsForRefresh.find(
			(e) => e.eventType === TokenRefreshEventType.REFRESH_FAILED,
		)

		const errorMessage = failEvent?.error?.message

		return {
			events: eventsForRefresh,
			summary: {
				refreshId,
				startTime,
				endTime,
				duration,
				success,
				httpRequestCount,
				statusCode,
				errorMessage,
			},
		}
	}

	/**
	 * Private method to record a trace event
	 */
	private recordEvent(event: TokenRefreshTraceEvent): void {
		// Add to history, maintaining max size
		this.traceHistory.push(event)

		// Trim history if needed
		if (this.traceHistory.length > this.options.maxHistorySize) {
			this.traceHistory = this.traceHistory.slice(-this.options.maxHistorySize)
		}

		// Call callback if provided
		if (this.options.tracerCallback) {
			try {
				this.options.tracerCallback(event)
			} catch (e) {
				console.error('Error calling tracer callback', e)
			}
		}
	}

	/**
	 * Helper to sanitize headers for logging
	 */
	private sanitizeHeaders(
		headers: Record<string, string> | null | undefined,
	): Record<string, string> {
		const result: Record<string, string> = {}

		// If headers is undefined or null, return an empty object
		if (!headers) {
			return result
		}

		// Make sure headers is an object that can be iterated
		if (typeof headers !== 'object') {
			return result
		}

		try {
			for (const [key, value] of Object.entries(headers)) {
				// Skip entries with null or undefined values
				if (value === undefined || value === null) {
					continue
				}

				// Convert value to string if it's not already
				const strValue = String(value)
				const lowerKey = key.toLowerCase()

				if (lowerKey === 'authorization') {
					// Show auth type but redact the actual token
					const parts = strValue.split(' ')
					if (parts.length > 1) {
						const authType = parts[0]
						const tokenStart = parts[1]!.substring(0, 8)
						result[key] = `${authType} ${tokenStart}...`
					} else {
						result[key] = '[REDACTED]'
					}
				} else if (
					lowerKey.includes('secret') ||
					lowerKey.includes('password') ||
					lowerKey.includes('token') ||
					lowerKey.includes('key')
				) {
					result[key] = '[REDACTED]'
				} else {
					result[key] = strValue
				}
			}
		} catch (error) {
			// If anything goes wrong during iteration, return a safe empty object
			console.error('Error sanitizing headers', error)
		}

		return result
	}
}

/**
 * Create a wrapped fetch function that traces token refresh operations
 * @param context The request context
 * @param fetchFn The original fetch function
 * @returns A wrapped fetch function that traces token operations
 */
export function createTracingFetch(
	fetchFn: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
	return async (req: Request) => {
		const url = req.url
		const method = req.method

		// Only trace token-related operations
		if (url.includes('/token') || url.includes('/oauth2')) {
			const tracer = TokenRefreshTracer.getInstance()
			const refreshId = tracer.startRefreshTrace()

			// Clone the request to read its body without consuming it
			const reqClone = req.clone()

			// Extract headers
			const headers: Record<string, string> = {}
			req.headers.forEach((value, key) => {
				headers[key] = value
			})

			// Extract body if it exists
			let body: any
			try {
				if (method !== 'GET' && method !== 'HEAD') {
					const contentType = req.headers.get('content-type') || ''

					if (contentType.includes('application/json')) {
						body = await reqClone.clone().json()
					} else if (
						contentType.includes('application/x-www-form-urlencoded')
					) {
						body = await reqClone.clone().text()
					}
				}
			} catch (e) {
				// Failed to extract request body
				console.error('Error extracting request body', e)
			}

			// Record the request
			tracer.recordRefreshRequest(refreshId, url, method, headers, body)

			try {
				// Execute the original fetch
				const response = await fetchFn(req)

				// Clone the response to read its body without consuming it
				const resClone = response.clone()

				// Extract headers
				const resHeaders: Record<string, string> = {}
				response.headers.forEach((value, key) => {
					resHeaders[key] = value
				})

				// Extract body
				let resBody: any
				try {
					const contentType = response.headers.get('content-type') || ''

					if (contentType.includes('application/json')) {
						resBody = await resClone.clone().json()
					} else {
						resBody = await resClone.clone().text()
					}
				} catch (e) {
					console.error('Error extracting response body', e)
					resBody = '[Failed to parse response body]'
				}

				// Record the response
				tracer.recordRefreshResponse(
					refreshId,
					response.status,
					resHeaders,
					resBody,
				)

				// Record success or failure based on status code
				if (response.ok) {
					// Try to extract token data
					try {
						if (typeof resBody === 'object' && resBody !== null) {
							const tokenData: Partial<TokenData> = {
								accessToken: resBody.access_token,
								refreshToken: resBody.refresh_token,
								expiresAt:
									resBody.expires_at ||
									(resBody.expires_in
										? Date.now() + resBody.expires_in * 1000
										: undefined),
							}

							tracer.recordRefreshSuccess(refreshId, tokenData)
						} else {
							tracer.recordRefreshSuccess(refreshId, {})
						}
					} catch (e) {
						console.error('Error extracting token data', e)
						tracer.recordRefreshSuccess(refreshId, {})
					}
				} else {
					tracer.recordRefreshFailure(refreshId, {
						message: `HTTP ${response.status}: ${response.statusText}`,
						name: 'HttpError',
						status: response.status,
					})
				}

				return response
			} catch (error) {
				// Record failure
				tracer.recordRefreshFailure(refreshId, error)
				throw error
			}
		}

		// For non-token requests, just use the original fetch
		return fetchFn(req)
	}
}
