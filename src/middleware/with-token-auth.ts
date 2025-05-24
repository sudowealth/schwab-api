import { type EnhancedTokenManager } from '../auth/enhanced-token-manager'
import { handleApiError } from '../errors'
import { createLogger } from '../utils/secure-logger'
import { type Middleware } from './compose'
import { getMetadata, cloneRequestWithMetadata } from './middleware-metadata'

const logger = createLogger('TokenAuth')

/**
 * Options for token authentication middleware
 */
export interface TokenAuthOptions {
	/**
	 * The token manager to use for authentication
	 */
	tokenManager: EnhancedTokenManager

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
	options: EnhancedTokenManager | TokenAuthOptions,
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
			logger.debug(`[withTokenAuth] Getting access token for ${req.url}`)

			// Debug: Check token provider type
			logger.debug(
				`[withTokenAuth] Token manager type: ${tokenManager.constructor.name}`,
			)

			// Check if token manager supports refresh
			const supportsRefresh = tokenManager.supportsRefresh()
			logger.debug(
				`[withTokenAuth] Token manager supports refresh: ${supportsRefresh}`,
			)

			// Use the unified getAccessToken method which handles refreshing internally
			// Note: We cannot pass refreshThresholdMs here as the interface doesn't accept parameters
			// These should be configured at the token manager level instead
			const accessToken = await tokenManager.getAccessToken()

			// Debug: Log token status (not the actual token)
			logger.debug(
				`[withTokenAuth] Token obtained: ${accessToken ? 'Yes (length: ' + accessToken.length + ')' : 'No'}`,
			)

			if (!accessToken) {
				logger.warn(
					`[withTokenAuth] No access token available from provider for request to ${req.method} ${req.url}. ` +
						`Provider: ${tokenManager.constructor.name}. Proceeding without authentication.`,
				)

				// Continue without authentication, which will likely result in a 401 error from the API
				// We don't throw here to allow for public endpoints that don't require authentication
				return next(req)
			}

			// Create a new request with updated headers and metadata
			const authorizedReq = cloneRequestWithMetadata(req)
			authorizedReq.headers.set('Authorization', `Bearer ${accessToken}`)

			// Debug: Log the headers being sent (without sensitive values)
			logger.debug(
				'[withTokenAuth] Request headers set:',
				Object.fromEntries(
					[...authorizedReq.headers.entries()].map(([k, v]) =>
						k.toLowerCase() === 'authorization' ? [k, 'Bearer ***'] : [k, v],
					),
				),
			)

			// Execute the request
			logger.debug(
				`[withTokenAuth] Executing authenticated request to ${req.url}`,
			)
			const response = await next(authorizedReq)

			// Debug: Log response status
			logger.debug(
				`[withTokenAuth] Response status: ${response.status} for ${req.url}`,
			)

			// Add auth metadata to the response
			const responseMetadata = getMetadata(response)
			responseMetadata.auth = metadata.auth

			return response
		} catch (error) {
			// Log the error with more context for debugging
			logger.error('[withTokenAuth] Failed to get access token:', error)

			// Provide detailed context for the error
			const context = `Failed to retrieve authentication token for request to ${req.method} ${req.url}`

			// Pass the error to the central error handler with improved context
			return handleApiError(error, context)
		}
	}
}
