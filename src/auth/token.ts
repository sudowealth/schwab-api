import { MEDIA_TYPES, OAUTH_GRANT_TYPES } from '../constants'
import { type RequestContext } from '../core/http'
import { handleApiError, createSchwabApiError } from '../errors'
import { type SchwabTokenResponse } from './types'
import { getTokenUrlWithContext } from './urls'

export interface ExchangeCodeForTokenOptions {
	clientId: string
	clientSecret: string
	code: string
	redirectUri: string
	tokenUrl?: string // default from getTokenUrlWithContext()
}

export interface RefreshTokenOptions {
	clientId: string
	clientSecret: string
	refreshToken: string
	tokenUrl?: string // default from getTokenUrlWithContext()
}

/**
 * Utility function for logging in token-related functions with context
 */
function tokenLogWithContext(
	context: RequestContext,
	level: 'info' | 'error' | 'warn',
	message: string,
	data?: any,
): void {
	const { config } = context
	if (!config.enableLogging) return

	const prefix = '[Schwab Auth]'

	if (data && level === 'info') {
		console[level](`${prefix} ${message}`)
	} else if (data) {
		console[level](`${prefix} ${message}`, data)
	} else {
		console[level](`${prefix} ${message}`)
	}
}

/**
 * Exchange an authorization code for an access token using the provided context
 */
export async function exchangeCodeForTokenWithContext(
	context: RequestContext,
	opts: ExchangeCodeForTokenOptions,
): Promise<SchwabTokenResponse> {
	const { config } = context
	const fetchFn = context.fetchFn
	const tokenEndpoint = opts.tokenUrl || getTokenUrlWithContext(context)

	const body = new URLSearchParams()
	body.append('grant_type', OAUTH_GRANT_TYPES.AUTHORIZATION_CODE)
	body.append('code', opts.code)
	body.append('redirect_uri', opts.redirectUri)
	// client_id and client_secret are sent in Authorization header (Basic Auth)

	const authHeader = 'Basic ' + btoa(`${opts.clientId}:${opts.clientSecret}`)

	tokenLogWithContext(
		context,
		'info',
		`Exchanging code for token at: ${tokenEndpoint}`,
	)

	try {
		// Add timeout support
		const controller = new AbortController()
		const timeoutId = setTimeout(
			() => controller.abort(),
			config.timeout as number,
		)

		const response = await fetchFn(
			new Request(tokenEndpoint, {
				method: 'POST',
				headers: {
					Authorization: authHeader,
					'Content-Type': MEDIA_TYPES.FORM,
				},
				body: body,
				signal: controller.signal,
			}),
		)

		// Clear the timeout
		clearTimeout(timeoutId)

		const data = await response.json()

		if (!response.ok) {
			tokenLogWithContext(context, 'error', 'Token exchange failed:')
			// Use createSchwabApiError for consistent error creation
			throw createSchwabApiError(
				response.status || 400,
				data,
				`Token exchange failed: ${data.error || response.statusText}`,
			)
		}

		tokenLogWithContext(context, 'info', 'Token exchange successful')
		return data as SchwabTokenResponse
	} catch (error) {
		tokenLogWithContext(context, 'error', 'Error during token exchange:')

		// Use the centralized error handler with context
		handleApiError(error, 'Token exchange failed')
	}
}

/**
 * Refresh an access token using a refresh token with context
 */
export async function refreshTokenWithContext(
	context: RequestContext,
	opts: RefreshTokenOptions,
): Promise<SchwabTokenResponse> {
	const { config } = context
	const fetchFn = context.fetchFn
	const tokenEndpoint = opts.tokenUrl || getTokenUrlWithContext(context)

	const body = new URLSearchParams()
	body.append('grant_type', OAUTH_GRANT_TYPES.REFRESH_TOKEN)
	body.append('refresh_token', opts.refreshToken)
	// Explicitly add client_id to payload (some OAuth servers require this in addition to Auth header)
	body.append('client_id', opts.clientId)
	// client_id and client_secret are also sent in Authorization header (Basic Auth)

	const authHeader = 'Basic ' + btoa(`${opts.clientId}:${opts.clientSecret}`)

	tokenLogWithContext(context, 'info', `Refreshing token at: ${tokenEndpoint}`)

	// Debug log payload for troubleshooting
	tokenLogWithContext(context, 'info', 'Token refresh request details:')

	try {
		// Add timeout support
		const controller = new AbortController()
		const timeoutId = setTimeout(
			() => controller.abort(),
			config.timeout as number,
		)

		const response = await fetchFn(
			new Request(tokenEndpoint, {
				method: 'POST',
				headers: {
					Authorization: authHeader,
					'Content-Type': MEDIA_TYPES.FORM,
				},
				body: body,
				signal: controller.signal,
			}),
		)

		// Clear the timeout
		clearTimeout(timeoutId)

		const data = await response.json()

		if (!response.ok) {
			tokenLogWithContext(context, 'error', 'Token refresh failed:')

			// Handle special cases for refresh token errors
			if (data.error === 'refresh_token_authentication_error') {
				throw createSchwabApiError(
					401,
					data,
					`Refresh token authentication failed - the token may have expired or been revoked. A new authentication flow is required.`,
				)
			} else if (data.error === 'unsupported_token_type') {
				throw createSchwabApiError(
					401,
					data,
					`Token refresh failed: The refresh token format is not supported - ${data.error_description || ''}`,
				)
			} else {
				// Use createSchwabApiError for consistent error creation
				throw createSchwabApiError(
					response.status || 400,
					data,
					`Token refresh failed: ${data.error || response.statusText} - ${data.error_description || ''}`,
				)
			}
		}

		tokenLogWithContext(context, 'info', 'Token refresh successful')
		return data as SchwabTokenResponse
	} catch (error) {
		tokenLogWithContext(context, 'error', 'Error during token refresh:')

		// Use the centralized error handler with context
		handleApiError(error, 'Token refresh failed')
	}
}
