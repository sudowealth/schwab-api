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
 * Specially sanitize a code for Schwab's OAuth requirements
 * This handles any encoding issues that might come up with special characters
 */
function sanitizeAuthCode(code: string): string {
	// First trim any whitespace
	const trimmedCode = code.trim()

	// Schwab's auth code contains special characters like "." and "@"
	// If the code was already URL decoded, it may need to be handled differently

	// Handle the @ character at the end if present (base64 padding character)
	// This should be already URL-encoded as %40 in most cases
	if (trimmedCode.endsWith('@')) {
		return trimmedCode.slice(0, -1) + '%40'
	}

	return trimmedCode
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

	// Ensure code is properly formatted for Schwab API requirements
	const authCode = sanitizeAuthCode(opts.code)

	tokenLogWithContext(
		context,
		'info',
		`Code value for exchange: ${authCode.slice(0, 5)}... (length: ${authCode.length})`,
	)

	const body = new URLSearchParams()
	body.append('grant_type', OAUTH_GRANT_TYPES.AUTHORIZATION_CODE)
	body.append('code', authCode)
	body.append('redirect_uri', opts.redirectUri)
	// client_id and client_secret are sent in Authorization header (Basic Auth)

	const authHeader = 'Basic ' + btoa(`${opts.clientId}:${opts.clientSecret}`)

	tokenLogWithContext(
		context,
		'info',
		`Exchanging code for token at: ${tokenEndpoint}`,
	)

	// Debug log to help diagnose issues
	tokenLogWithContext(
		context,
		'info',
		`Token exchange details: redirect_uri=${opts.redirectUri}, body=${body.toString()}`,
	)

	try {
		// Add timeout support
		const controller = new AbortController()
		const timeoutId = setTimeout(
			() => controller.abort(),
			config.timeout as number,
		)

		// Allow for customization of fetch options through config
		const requestInit: RequestInit = {
			method: 'POST',
			headers: {
				Authorization: authHeader,
				'Content-Type': MEDIA_TYPES.FORM,
				Accept: 'application/json',
			},
			body: body,
			signal: controller.signal,
		}

		// Debug log the actual request details
		tokenLogWithContext(context, 'info', `Token exchange request headers:`, {
			Authorization: `Basic ***`, // Don't log the actual credentials
			'Content-Type': MEDIA_TYPES.FORM,
			Accept: 'application/json',
		})

		const response = await fetchFn(new Request(tokenEndpoint, requestInit))

		// Clear the timeout
		clearTimeout(timeoutId)

		// Log response status and headers for debugging
		const responseHeaders: Record<string, string> = {}
		response.headers.forEach((value, key) => {
			responseHeaders[key] = value
		})

		tokenLogWithContext(
			context,
			'info',
			`Token exchange response status: ${response.status}`,
			{ headers: responseHeaders },
		)

		let data
		try {
			data = await response.json()
		} catch (parseError) {
			tokenLogWithContext(
				context,
				'error',
				'Failed to parse token response:',
				parseError,
			)

			// Try to get text content for better debugging
			try {
				const textContent = await response.text()
				tokenLogWithContext(context, 'error', 'Raw response content:', {
					text: textContent.slice(0, 200),
					status: response.status,
					statusText: response.statusText,
				})
			} catch (textError) {
				// Unable to get text content
				tokenLogWithContext(
					context,
					'error',
					'Unable to get text content:',
					textError,
				)
			}

			throw createSchwabApiError(
				response.status || 400,
				{ parseError: 'Invalid JSON response' },
				`Token exchange failed: Invalid JSON response`,
			)
		}

		if (!response.ok) {
			tokenLogWithContext(context, 'error', 'Token exchange failed:', data)

			// Check for specific Schwab API error codes
			if (data && data.error) {
				if (data.error === 'invalid_grant') {
					// This typically means the authorization code is invalid or expired
					tokenLogWithContext(
						context,
						'error',
						'Invalid or expired authorization code',
					)
				} else if (data.error === 'invalid_client') {
					// This typically means client credentials are incorrect
					tokenLogWithContext(
						context,
						'error',
						'Invalid client credentials (client_id or client_secret)',
					)
				} else if (data.error === 'invalid_request') {
					// This could mean missing parameters or invalid redirect_uri
					tokenLogWithContext(
						context,
						'error',
						'Invalid request - check redirect_uri and required parameters',
					)
				}
			}

			// Use createSchwabApiError for consistent error creation
			throw createSchwabApiError(
				response.status || 400,
				data,
				`Token exchange failed: ${data.error || response.statusText} ${data.error_description ? `- ${data.error_description}` : ''}`,
			)
		}

		tokenLogWithContext(context, 'info', 'Token exchange successful')
		return data as SchwabTokenResponse
	} catch (error) {
		tokenLogWithContext(context, 'error', 'Error during token exchange:', error)

		// Use the centralized error handler with context and make sure to throw
		throw handleApiError(error, 'Token exchange failed')
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
	tokenLogWithContext(context, 'info', 'Token refresh request details:', {
		tokenEndpoint,
		refreshTokenLength: opts.refreshToken.length,
	})

	// Import the token refresh tracer dynamically to avoid circular dependencies
	const { TokenRefreshTracer } = await import('./token-refresh-tracer')
	const tracer = TokenRefreshTracer.getInstance()
	const refreshId = tracer.startRefreshTrace()

	// Capture the full request details for diagnostics
	const requestHeaders = {
		Authorization: authHeader,
		'Content-Type': MEDIA_TYPES.FORM,
		Accept: 'application/json',
	}

	// Log very detailed request information
	tokenLogWithContext(
		context,
		'info',
		`Token refresh request [ID: ${refreshId}] to: ${tokenEndpoint}`,
		{
			method: 'POST',
			contentType: MEDIA_TYPES.FORM,
			refreshTokenLength: opts.refreshToken.length,
			refreshTokenFirstChars: opts.refreshToken.substring(0, 4),
			clientIdFirstChars: opts.clientId.substring(0, 4),
			currentTimestamp: new Date().toISOString(),
			requestId: refreshId,
		},
	)

	// Record the HTTP request in the tracer
	tracer.recordRefreshRequest(
		refreshId,
		tokenEndpoint,
		'POST',
		requestHeaders,
		body.toString(),
	)

	try {
		// Add timeout support
		const controller = new AbortController()
		const timeoutId = setTimeout(
			() => controller.abort(),
			config.timeout as number,
		)

		const startTime = Date.now()

		const response = await fetchFn(
			new Request(tokenEndpoint, {
				method: 'POST',
				headers: requestHeaders,
				body: body,
				signal: controller.signal,
			}),
		)

		// Clear the timeout
		clearTimeout(timeoutId)

		const requestDuration = Date.now() - startTime

		// Log response details
		const responseHeaders: Record<string, string> = {}
		response.headers.forEach((value, key) => {
			responseHeaders[key] = value
		})

		tokenLogWithContext(
			context,
			'info',
			`Token refresh response [ID: ${refreshId}] status: ${response.status} (${requestDuration}ms)`,
			{
				status: response.status,
				statusText: response.statusText,
				headers: responseHeaders,
				durationMs: requestDuration,
			},
		)

		let data
		try {
			data = await response.json()
		} catch (parseError) {
			tokenLogWithContext(
				context,
				'error',
				'Failed to parse token refresh response:',
				parseError,
			)

			// Try to get text content for better debugging
			try {
				const textContent = await response.text()
				tokenLogWithContext(context, 'error', 'Raw response content:', {
					text: textContent.slice(0, 200),
					status: response.status,
					statusText: response.statusText,
				})
			} catch (textError) {
				// Unable to get text content
				tokenLogWithContext(
					context,
					'error',
					'Unable to get text content:',
					textError,
				)
			}

			throw createSchwabApiError(
				response.status || 400,
				{ parseError: 'Invalid JSON response' },
				`Token refresh failed: Invalid JSON response`,
			)
		}

		if (!response.ok) {
			tokenLogWithContext(context, 'error', 'Token refresh failed:', data)

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
			} else if (data.error === 'invalid_grant') {
				throw createSchwabApiError(
					401,
					data,
					`Token refresh failed: Invalid or expired refresh token. A new authentication flow is required.`,
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
		tokenLogWithContext(context, 'error', 'Error during token refresh:', error)

		// Use the centralized error handler with context and make sure to throw
		throw handleApiError(error, 'Token refresh failed')
	}
}
