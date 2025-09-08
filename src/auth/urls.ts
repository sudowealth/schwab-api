import { OAUTH_ENDPOINTS } from '../constants.js'
import { resolveBaseUrl } from '../core/config.js'
import { type RequestContext } from '../core/http.js'

/**
 * Get the OAuth base URL based on the current configuration using the provided context
 */
export function getOAuthBaseUrlWithContext(context: RequestContext): string {
	const config = context.config
	// Use the centralized base URL resolution function
	const baseUrl = resolveBaseUrl(config)
	const apiVersion = config.apiVersion
	return `${baseUrl}/${apiVersion}`
}

/**
 * Get the authorization URL based on the provided context
 */
export function getAuthorizationUrlWithContext(
	context: RequestContext,
): string {
	return `${getOAuthBaseUrlWithContext(context)}${OAUTH_ENDPOINTS.AUTHORIZE}`
}

/**
 * Get the token URL based on the provided context
 */
export function getTokenUrlWithContext(context: RequestContext): string {
	return `${getOAuthBaseUrlWithContext(context)}${OAUTH_ENDPOINTS.TOKEN}`
}

export interface BuildAuthorizeUrlOptions {
	clientId: string
	redirectUri: string
	scope?: string // e.g., "api offline_access"
	state?: string
	baseUrl?: string // Overrides the default base URL if provided
}

/**
 * Build the authorization URL with the provided context and options
 */
export function buildAuthorizeUrlWithContext(
	context: RequestContext,
	opts: BuildAuthorizeUrlOptions,
): string {
	const authBaseUrl = opts.baseUrl || getAuthorizationUrlWithContext(context)
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
