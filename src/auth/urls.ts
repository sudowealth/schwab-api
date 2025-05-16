import { OAUTH_ENDPOINTS } from '../constants'
import { getEffectiveConfig } from '../core/http'

/**
 * Get the OAuth base URL based on the current configuration
 */
export function getOAuthBaseUrl(): string {
	const config = getEffectiveConfig()
	const baseUrl = config.baseUrl
	const apiVersion = config.apiVersion
	return `${baseUrl}/${apiVersion}`
}

/**
 * Get the authorization URL based on the current configuration
 */
export function getAuthorizationUrl(): string {
	return `${getOAuthBaseUrl()}${OAUTH_ENDPOINTS.AUTHORIZE}`
}

/**
 * Get the token URL based on the current configuration
 */
export function getTokenUrl(): string {
	return `${getOAuthBaseUrl()}${OAUTH_ENDPOINTS.TOKEN}`
}

export interface BuildAuthorizeUrlOptions {
	clientId: string
	redirectUri: string
	scope?: string // e.g., "api offline_access"
	state?: string
	baseUrl?: string // Overrides the default base URL if provided
}

export function buildAuthorizeUrl(opts: BuildAuthorizeUrlOptions): string {
	const authBaseUrl = opts.baseUrl || getAuthorizationUrl()
	const url = new URL(authBaseUrl)

	url.searchParams.set('client_id', opts.clientId)
	url.searchParams.set('redirect_uri', opts.redirectUri)

	if (opts.scope) {
		url.searchParams.set('scope', opts.scope)
	}

	if (opts.state) {
		url.searchParams.set('state', opts.state)
	}

	// Schwab requires response_type=code
	url.searchParams.set('response_type', 'code')

	return url.toString()
}
