import { SchwabApiError } from '../core/errors'
import { getSchwabApiConfig } from '../core/http'
import { SCHWAB_OAUTH_BASE } from './urls'

export interface ExchangeCodeForTokenOptions {
	clientId: string
	clientSecret: string
	code: string
	redirectUri: string
	tokenUrl?: string // default SCHWAB_OAUTH_BASE + '/token'
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
	tokenUrl?: string // default from config/SCHWAB_OAUTH_BASE + '/token'
	fetch?: typeof fetch // Optional fetch override
}

/**
 * Internal function to exchange an authorization code for a token
 * @internal
 */
async function _exchangeCodeForToken(
	opts: ExchangeCodeForTokenOptions,
): Promise<SchwabTokenResponse> {
	const config = getSchwabApiConfig()
	const fetchFn = opts.fetch || fetch // Use provided fetch or global fetch
	const baseOAuthUrl = config.baseUrl
		? config.baseUrl.replace(/\/$/, '') + '/v1/oauth'
		: SCHWAB_OAUTH_BASE
	const tokenEndpoint = opts.tokenUrl || baseOAuthUrl + '/token'

	const body = new URLSearchParams()
	body.append('grant_type', 'authorization_code')
	body.append('code', opts.code)
	body.append('redirect_uri', opts.redirectUri)
	// client_id and client_secret are sent in Authorization header (Basic Auth)

	const authHeader = 'Basic ' + btoa(`${opts.clientId}:${opts.clientSecret}`)

	if (config.enableLogging) {
		console.log(
			`[Schwab API Client] Exchanging code for token at: ${tokenEndpoint}`,
		)
	}

	try {
		const response = await fetchFn(tokenEndpoint, {
			method: 'POST',
			headers: {
				Authorization: authHeader,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: body,
		})

		const data = await response.json()

		if (!response.ok) {
			if (config.enableLogging) {
				console.error('[Schwab API Client] Token exchange failed:', data)
			}
			const status = typeof response.status === 'number' ? response.status : 400
			throw new SchwabApiError(
				status,
				data,
				`Token exchange failed with status ${status}`,
			)
		}
		if (config.enableLogging) {
			console.log('[Schwab API Client] Token exchange successful')
		}
		return data as SchwabTokenResponse
	} catch (error) {
		if (config.enableLogging && !(error instanceof SchwabApiError)) {
			console.error('[Schwab API Client] Error during token exchange:', error)
		}
		if (error instanceof SchwabApiError) throw error
		throw new SchwabApiError(
			500,
			error instanceof Error
				? { message: error.message, originalError: error }
				: { detail: String(error), originalError: error },
			'Network or other error during token exchange.',
		)
	}
}

/**
 * Internal function to refresh an access token using a refresh token
 * @internal
 */
async function _refreshToken(
	opts: RefreshTokenOptions,
): Promise<SchwabTokenResponse> {
	const config = getSchwabApiConfig()
	const fetchFn = opts.fetch || fetch // Use provided fetch or global fetch
	const baseOAuthUrl = config.baseUrl
		? config.baseUrl.replace(/\/$/, '') + '/v1/oauth'
		: SCHWAB_OAUTH_BASE
	const tokenEndpoint = opts.tokenUrl || baseOAuthUrl + '/token'

	const body = new URLSearchParams()
	body.append('grant_type', 'refresh_token')
	body.append('refresh_token', opts.refreshToken)
	// client_id and client_secret are sent in Authorization header (Basic Auth)

	const authHeader = 'Basic ' + btoa(`${opts.clientId}:${opts.clientSecret}`)

	if (config.enableLogging) {
		console.log(`[Schwab API Client] Refreshing token at: ${tokenEndpoint}`)
	}

	try {
		const response = await fetchFn(tokenEndpoint, {
			method: 'POST',
			headers: {
				Authorization: authHeader,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: body,
		})

		const data = await response.json()

		if (!response.ok) {
			if (config.enableLogging) {
				console.error('[Schwab API Client] Token refresh failed:', data)
			}
			const status = typeof response.status === 'number' ? response.status : 400
			throw new SchwabApiError(
				status,
				data,
				`Token refresh failed with status ${status}`,
			)
		}

		if (config.enableLogging) {
			console.log('[Schwab API Client] Token refresh successful')
		}
		return data as SchwabTokenResponse
	} catch (error) {
		if (config.enableLogging && !(error instanceof SchwabApiError)) {
			console.error('[Schwab API Client] Error during token refresh:', error)
		}
		if (error instanceof SchwabApiError) throw error
		throw new SchwabApiError(
			500,
			error instanceof Error
				? { message: error.message, originalError: error }
				: { detail: String(error), originalError: error },
			'Network or other error during token refresh.',
		)
	}
}

// Re-export the same functions with new names for internal use
export const exchangeCodeForToken = _exchangeCodeForToken
export const refreshToken = _refreshToken