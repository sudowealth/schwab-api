import { type Middleware } from './compose'
import { getMetadata, cloneRequestWithMetadata } from './middleware-metadata'

/**
 * Options for request/response debugging middleware
 */
export interface DebugOptions {
	/**
	 * Log request details
	 * @default true
	 */
	logRequest?: boolean

	/**
	 * Log response details
	 * @default true
	 */
	logResponse?: boolean

	/**
	 * Log request and response bodies
	 * @default false
	 */
	logBodies?: boolean

	/**
	 * Custom tag to identify this middleware instance in logs
	 * @default 'debug'
	 */
	tag?: string

	/**
	 * Callback function to receive debug information
	 * If provided, this will be called instead of console.log
	 */
	callback?: (info: DebugInfo) => void

	/**
	 * Whether to format objects for better readability in logs
	 * @default false
	 */
	prettyPrint?: boolean
}

/**
 * Structure of debug information provided to callback
 */
export interface DebugInfo {
	/**
	 * Timestamp when the log was generated
	 */
	timestamp: string

	/**
	 * Custom tag to identify the middleware instance
	 */
	tag: string

	/**
	 * Type of log entry (request or response)
	 */
	type: 'request' | 'response' | 'error'

	/**
	 * For requests: Full URL including query parameters
	 * For responses: Status code and text
	 */
	endpoint: string

	/**
	 * Request or response headers, with sensitive values redacted
	 */
	headers: Record<string, string>

	/**
	 * Request or response body, if logBodies is enabled
	 */
	body?: any

	/**
	 * Error information, if an error occurred
	 */
	error?: {
		message: string
		stack?: string
		status?: number
		details?: any
	}

	/**
	 * Additional metadata about the request/response
	 */
	metadata?: Record<string, any>
}

/**
 * Default options for debugging middleware
 */
const DEFAULT_DEBUG_OPTIONS: Required<Omit<DebugOptions, 'callback'>> = {
	logRequest: true,
	logResponse: true,
	logBodies: false,
	tag: 'debug',
	prettyPrint: false,
}

/**
 * Helper function to safely clone and parse JSON request/response bodies
 */
async function safeParseBody(req: Request | Response): Promise<any> {
	// Clone to avoid consuming the body stream
	const clone = req.clone()

	try {
		const contentType = clone.headers.get('content-type') || ''

		if (contentType.includes('application/json')) {
			return await clone.json()
		} else if (contentType.includes('application/x-www-form-urlencoded')) {
			const text = await clone.text()
			const params = new URLSearchParams(text)
			return Object.fromEntries(params.entries())
		} else {
			const text = await clone.text()
			return text.length > 0 ? text : undefined
		}
	} catch (e) {
		return `[Body cannot be parsed: ${(e as Error).message}]`
	}
}

/**
 * Redact sensitive information from headers
 */
function redactSensitiveHeaders(headers: Headers): Record<string, string> {
	const result: Record<string, string> = {}

	headers.forEach((value, key) => {
		const lowerKey = key.toLowerCase()
		if (lowerKey === 'authorization') {
			// Show auth type but redact the actual token
			const parts = value.split(' ')
			if (parts.length > 1) {
				const authType = parts[0]
				const tokenStart = parts[1]?.substring(0, 8) || ''
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
			result[key] = value
		}
	})

	return result
}

/**
 * Create debugging middleware for inspecting requests and responses
 *
 * This middleware is useful for troubleshooting API calls, especially authentication issues.
 * It logs detailed information about requests, responses, and any errors that occur.
 *
 * @param options Debugging options
 * @returns A middleware function
 */
export function withDebug(options: DebugOptions = {}): Middleware {
	const config = {
		...DEFAULT_DEBUG_OPTIONS,
		...options,
	}

	const { tag, logRequest, logResponse, logBodies, callback } = config

	return async (req, next) => {
		const metadata = getMetadata(req)

		// Initialize debug metadata if not exists
		if (!metadata.debug) {
			metadata.debug = { requestLogged: false, responseLogged: false }
		}

		// Log request details
		if (logRequest && !metadata.debug.requestLogged) {
			metadata.debug.requestLogged = true

			let body: any
			if (logBodies && req.method !== 'GET' && req.method !== 'HEAD') {
				body = await safeParseBody(req)
			}

			const info: DebugInfo = {
				timestamp: new Date().toISOString(),
				tag,
				type: 'request',
				endpoint: `${req.method} ${req.url}`,
				headers: redactSensitiveHeaders(req.headers),
				...(body !== undefined && { body }),
				metadata: {
					// Add relevant request metadata
					queryParams: new URL(req.url).searchParams.toString(),
				},
			}

			if (callback) {
				callback(info)
			}
			// Console logging removed
		}

		// Create a new request with updated metadata
		const newReq = cloneRequestWithMetadata(req)

		try {
			// Execute the request
			const response = await next(newReq)

			// Add metadata to the response
			const responseMetadata = getMetadata(response)
			responseMetadata.debug = metadata.debug

			// Log response details
			if (logResponse && !responseMetadata.debug.responseLogged) {
				responseMetadata.debug.responseLogged = true

				let body: any
				if (logBodies) {
					body = await safeParseBody(response)
				}

				const info: DebugInfo = {
					timestamp: new Date().toISOString(),
					tag,
					type: 'response',
					endpoint: `${response.status} ${response.statusText} (${req.method} ${req.url})`,
					headers: redactSensitiveHeaders(response.headers),
					...(body !== undefined && { body }),
					metadata: {
						// Add relevant response metadata
						timing: performance.now(), // Approximate response time
					},
				}

				if (callback) {
					callback(info)
				}
				// Console logging removed
			}

			return response
		} catch (error) {
			// Log error details
			const errorInfo: DebugInfo = {
				timestamp: new Date().toISOString(),
				tag,
				type: 'error',
				endpoint: `ERROR (${req.method} ${req.url})`,
				headers: redactSensitiveHeaders(req.headers),
				error: {
					message: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
					status: (error as any)?.status,
					details: (error as any)?.details || (error as any)?.data,
				},
			}

			if (callback) {
				callback(errorInfo)
			}
			// Console logging removed

			throw error
		}
	}
}
