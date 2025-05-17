/**
 * Metadata structure for communication between middleware components
 * This information is carried along with requests and responses to coordinate actions
 */
export interface MiddlewareMetadata {
	/**
	 * Rate limit information
	 */
	rateLimit?: {
		/**
		 * Whether the request has been queued by rate limit middleware
		 */
		wasQueued?: boolean

		/**
		 * Remaining requests in the current window
		 */
		remaining?: number

		/**
		 * When the rate limit window will reset (epoch ms)
		 */
		resetAt?: number

		/**
		 * Maximum requests allowed per window
		 */
		limit?: number
	}

	/**
	 * Retry information
	 */
	retry?: {
		/**
		 * Whether this is a retry attempt
		 */
		isRetry?: boolean

		/**
		 * Current attempt number (1-based)
		 */
		attemptNumber?: number

		/**
		 * Maximum number of attempts (including the initial attempt)
		 */
		maxAttempts?: number

		/**
		 * Whether the rate limit middleware should be skipped for this retry
		 * Used to avoid double-queueing when retrying rate-limited requests
		 */
		skipRateLimit?: boolean
	}

	/**
	 * Authentication information
	 */
	auth?: {
		/**
		 * Whether the token was refreshed for this request
		 */
		tokenRefreshed?: boolean
	}

	/**
	 * Custom metadata for extension middleware
	 */
	[key: string]: any
}

/**
 * Symbol used to store middleware metadata on Request and Response objects
 */
export const MIDDLEWARE_METADATA = Symbol('MIDDLEWARE_METADATA')

/**
 * Gets middleware metadata from a Request or Response
 * Creates an empty object if no metadata exists yet
 */
export function getMetadata(obj: Request | Response): MiddlewareMetadata {
	// Check if the object is extensible and has the symbol property already
	if (Object.getOwnPropertySymbols(obj).includes(MIDDLEWARE_METADATA)) {
		return (obj as any)[MIDDLEWARE_METADATA]
	}

	// Create new metadata object
	const metadata: MiddlewareMetadata = {}

	try {
		// Try to set the symbol property on the object
		Object.defineProperty(obj, MIDDLEWARE_METADATA, {
			value: metadata,
			enumerable: false,
			writable: true,
		})
	} catch (e: any) {
		// If we can't modify the object (e.g., frozen objects), log a warning
		console.warn(
			'Could not attach metadata to object, some middleware coordination might not work properly. Error:',
			e?.message || e,
		)
	}

	return metadata
}

/**
 * Creates a new Request with the metadata from the original
 * Useful when you need to clone a request but maintain its metadata
 */
export function cloneRequestWithMetadata(req: Request): Request {
	const newReq = new Request(req.url, req)
	const metadata = getMetadata(req)
	Object.defineProperty(newReq, MIDDLEWARE_METADATA, {
		value: { ...metadata },
		enumerable: false,
		writable: true,
	})
	return newReq
}
