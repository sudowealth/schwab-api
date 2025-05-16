import { MEDIA_TYPES, OAUTH_GRANT_TYPES } from '../constants'
import {
	SchwabApiError,
	SchwabAuthorizationError,
	SchwabServerError,
} from '../core/errors'
import { getEffectiveConfig } from '../core/http'
import { getTokenUrl } from './urls'

export interface ExchangeCodeForTokenOptions {
	clientId: string
	clientSecret: string
	code: string
	redirectUri: string
	tokenUrl?: string // default from getTokenUrl()
	fetch?: typeof fetch // Optional fetch override
}

export interface SchwabTokenResponse {
	access_token: string
	expires_in: number
	refresh_token?: string
	scope: string
	id_token?: string
	token_type: string
}

export interface RefreshTokenOptions {
	clientId: string
	clientSecret: string
	refreshToken: string
	tokenUrl?: string // default from getTokenUrl()
	fetch?: typeof fetch // Optional fetch override
}

/**
 * Utility function for logging in token-related functions
 */
function tokenLog(
	level: 'info' | 'error' | 'warn',
	message: string,
	data?: any,
): void {
	const config = getEffectiveConfig()
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
 * Exchange an authorization code for an access token
 */
export async function exchangeCodeForToken(
	opts: ExchangeCodeForTokenOptions,
): Promise<SchwabTokenResponse> {
	const config = getEffectiveConfig()
	const fetchFn = opts.fetch || fetch
	const tokenEndpoint = opts.tokenUrl || getTokenUrl()

	const body = new URLSearchParams()
	body.append('grant_type', OAUTH_GRANT_TYPES.AUTHORIZATION_CODE)
	body.append('code', opts.code)
	body.append('redirect_uri', opts.redirectUri)
	// client_id and client_secret are sent in Authorization header (Basic Auth)

	const authHeader = 'Basic ' + btoa(`${opts.clientId}:${opts.clientSecret}`)

	tokenLog('info', `Exchanging code for token at: ${tokenEndpoint}`)

	try {
		// Add timeout support
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), config.timeout)

		const response = await fetchFn(tokenEndpoint, {
			method: 'POST',
			headers: {
				Authorization: authHeader,
				'Content-Type': MEDIA_TYPES.FORM,
			},
			body: body,
			signal: controller.signal,
		})

		// Clear the timeout
		clearTimeout(timeoutId)

		const data = await response.json()

		if (!response.ok) {
			tokenLog('error', 'Token exchange failed:', data)
			const status = typeof response.status === 'number' ? response.status : 400

			if (status === 401) {
				throw new SchwabAuthorizationError(
					data,
					`Token exchange failed: ${data.error || 'Unauthorized'}`,
				)
			} else {
				throw new SchwabApiError(
					status,
					data,
					`Token exchange failed with status ${status}: ${data.error || response.statusText}`,
				)
			}
		}

		tokenLog('info', 'Token exchange successful')
		return data as SchwabTokenResponse
	} catch (error) {
		// Handle AbortError separately
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new SchwabApiError(
				408, // Request Timeout
				{ message: 'Request timed out' },
				`Token exchange request timed out after ${config.timeout}ms`,
			)
		}

		if (!(error instanceof SchwabApiError)) {
			tokenLog('error', 'Error during token exchange:', error)

			throw new SchwabServerError(
				error instanceof Error
					? { message: error.message, originalError: error }
					: { detail: String(error), originalError: error },
				'Network or other error during token exchange',
			)
		}

		throw error
	}
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshToken(
	opts: RefreshTokenOptions,
): Promise<SchwabTokenResponse> {
	const config = getEffectiveConfig()
	const fetchFn = opts.fetch || fetch
	const tokenEndpoint = opts.tokenUrl || getTokenUrl()

	const body = new URLSearchParams()
	body.append('grant_type', OAUTH_GRANT_TYPES.REFRESH_TOKEN)
	body.append('refresh_token', opts.refreshToken)
	// Explicitly add client_id to payload (some OAuth servers require this in addition to Auth header)
	body.append('client_id', opts.clientId)
	// client_id and client_secret are also sent in Authorization header (Basic Auth)

	const authHeader = 'Basic ' + btoa(`${opts.clientId}:${opts.clientSecret}`)

	tokenLog('info', `Refreshing token at: ${tokenEndpoint}`)

	// Debug log payload for troubleshooting
	tokenLog('info', 'Token refresh request details:', {
		grant_type: OAUTH_GRANT_TYPES.REFRESH_TOKEN,
		refresh_token_length: opts.refreshToken.length,
		refresh_token_prefix: opts.refreshToken.substring(0, 10) + '...',
	})

	try {
		// Add timeout support
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), config.timeout)

		const response = await fetchFn(tokenEndpoint, {
			method: 'POST',
			headers: {
				Authorization: authHeader,
				'Content-Type': MEDIA_TYPES.FORM,
			},
			body: body,
			signal: controller.signal,
		})

		// Clear the timeout
		clearTimeout(timeoutId)

		const data = await response.json()

		if (!response.ok) {
			tokenLog('error', 'Token refresh failed:', {
				status: response.status,
				statusText: response.statusText,
				error: data.error,
				error_description: data.error_description,
				response: data,
			})
			const status = typeof response.status === 'number' ? response.status : 400

			// Handle specific refresh token errors with more helpful messages
			if (data.error === 'refresh_token_authentication_error') {
				throw new SchwabAuthorizationError(
					data,
					`Refresh token authentication failed - the token may have expired or been revoked. A new authentication flow is required.`,
				)
			} else if (data.error === 'unsupported_token_type') {
				throw new SchwabAuthorizationError(
					data,
					`Token refresh failed: The refresh token format is not supported - ${data.error_description || ''}`,
				)
			} else if (status === 401) {
				throw new SchwabAuthorizationError(
					data,
					`Token refresh failed: ${data.error || 'Unauthorized'} - ${data.error_description || ''}`,
				)
			} else {
				throw new SchwabApiError(
					status,
					data,
					`Token refresh failed with status ${status}: ${data.error || response.statusText} - ${data.error_description || ''}`,
				)
			}
		}

		tokenLog('info', 'Token refresh successful')
		return data as SchwabTokenResponse
	} catch (error) {
		// Handle AbortError separately
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new SchwabApiError(
				408, // Request Timeout
				{ message: 'Request timed out' },
				`Token refresh request timed out after ${config.timeout}ms`,
			)
		}

		if (!(error instanceof SchwabApiError)) {
			tokenLog('error', 'Error during token refresh:', error)

			throw new SchwabServerError(
				error instanceof Error
					? { message: error.message, originalError: error }
					: { detail: String(error), originalError: error },
				'Network or other error during token refresh',
			)
		}

		throw error
	}
}
