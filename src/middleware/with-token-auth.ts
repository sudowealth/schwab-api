import { type ITokenLifecycleManager } from '../auth/token-lifecycle-manager'
import { handleApiError } from '../errors'
import { type Middleware } from './compose'
import { getMetadata, cloneRequestWithMetadata } from './middleware-metadata'

/**
 * Options for token authentication middleware
 */
export interface TokenAuthOptions {
	/**
	 * The token manager to use for authentication
	 */
	tokenManager: ITokenLifecycleManager

	/**
	 * Advanced token authentication options
	 */
	advanced?: {
		/**
		 * Whether to refresh tokens that will expire soon
		 * @default true
		 */
		refreshExpiring?: boolean

		/**
		 * Time in milliseconds before token expiration to trigger a refresh
		 * @default 300_000 (5 minutes)
		 */
		refreshThresholdMs?: number
	}
}

/**
 * Default token authentication options
 */
export const DEFAULT_TOKEN_AUTH_OPTIONS: Omit<
	TokenAuthOptions,
	'tokenManager'
> = {
	advanced: {
		refreshExpiring: true,
		refreshThresholdMs: 300_000, // 5 minutes
	},
}

/**
 * Create a middleware that adds authentication headers to requests
 * and handles token refresh when needed.
 *
 * This middleware is designed to work with the unified ITokenLifecycleManager interface.
 *
 * @param options The token manager or options object
 * @returns A middleware function
 */
export function withTokenAuth(
	options: ITokenLifecycleManager | TokenAuthOptions,
): Middleware {
	// Handle both function signatures (tokenManager or options object)
	let config: TokenAuthOptions

	if ('tokenManager' in options) {
		config = {
			...options,
			advanced: {
				...DEFAULT_TOKEN_AUTH_OPTIONS.advanced,
				...options.advanced,
			},
		}
	} else {
		config = {
			tokenManager: options,
			...DEFAULT_TOKEN_AUTH_OPTIONS,
		}
	}

	const tokenManager = config.tokenManager

	return async (req, next) => {
		// Get middleware metadata
		const metadata = getMetadata(req)

		// Initialize auth metadata if not exists
		if (!metadata.auth) {
			metadata.auth = { tokenRefreshed: false }
		}

		try {
			// Use the unified getAccessToken method which handles refreshing internally
			// Note: We cannot pass refreshThresholdMs here as the interface doesn't accept parameters
			// These should be configured at the token manager level instead
			const accessToken = await tokenManager.getAccessToken()

			if (!accessToken) {
				console.warn(
					`withTokenAuth: No access token available from provider for request to ${req.method} ${req.url}. ` +
						`Provider: ${tokenManager.constructor.name}. Proceeding without authentication.`,
				)

				// Continue without authentication, which will likely result in a 401 error from the API
				// We don't throw here to allow for public endpoints that don't require authentication
				return next(req)
			}

			// Create a new request with updated headers and metadata
			const authorizedReq = cloneRequestWithMetadata(req)
			authorizedReq.headers.set('Authorization', `Bearer ${accessToken}`)

			// Execute the request
			const response = await next(authorizedReq)

			// Add auth metadata to the response
			const responseMetadata = getMetadata(response)
			responseMetadata.auth = metadata.auth

			return response
		} catch (error) {
			// Log the error with more context for debugging
			console.error('withTokenAuth: Failed to get access token:', error)

			// Provide detailed context for the error
			const context = `Failed to retrieve authentication token for request to ${req.method} ${req.url}`

			// Pass the error to the central error handler with improved context
			return handleApiError(error, context)
		}
	}
}
