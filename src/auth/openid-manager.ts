import * as oidc from 'openid-client'
import { API_URLS, API_VERSIONS } from '../constants'
import {
	type AuthClientOptions,
	type TokenData,
	type TokenSet,
	type RefreshOptions,
	type FullAuthClient,
} from './types'

export interface OpenIdManagerOptions extends AuthClientOptions {
	issuerBaseUrl?: string
}

// Helper interface for creating oidc-compatible responses
interface TokenResponseData {
	access_token: string
	refresh_token?: string
	expires_in: number
	token_type: string
	scope?: string
}

export class OpenIdTokenManager implements FullAuthClient {
	private config: oidc.Configuration
	private tokenSet?: oidc.TokenEndpointResponse &
		oidc.TokenEndpointResponseHelpers
	private defaultScope: string[]
	private loadFn?: () => Promise<TokenSet | null>
	private saveFn?: (t: TokenSet) => Promise<void>
	private refreshCallbacks: Array<(t: TokenSet) => void> = []

	constructor(options: OpenIdManagerOptions) {
		const base =
			options.issuerBaseUrl ?? `${API_URLS.PRODUCTION}/${API_VERSIONS.v1}`
		const server = {
			issuer: base,
			authorization_endpoint: `${base}/oauth/authorize`,
			token_endpoint: `${base}/oauth/token`,
		} as oidc.ServerMetadata

		this.config = new oidc.Configuration(server, options.clientId, {
			client_secret: options.clientSecret,
			redirect_uris: [options.redirectUri],
		})
		this.defaultScope = options.scope ?? ['api', 'offline_access']
		this.loadFn = options.load
		this.saveFn = options.save
	}

	getAuthorizationUrl(opts?: { scope?: string[]; state?: string }): {
		authUrl: string
	} {
		const redirectUris = this.config.clientMetadata().redirect_uris as
			| string[]
			| undefined
		const redirectUri = (redirectUris ? redirectUris[0] : '') as string
		const parameters: Record<string, string> = {
			redirect_uri: redirectUri,
			scope: (opts?.scope ?? this.defaultScope).join(' '),
		}
		if (opts?.state) parameters.state = opts.state
		const url = oidc.buildAuthorizationUrl(this.config, parameters)
		return { authUrl: url.toString() }
	}

	async exchangeCode(code: string): Promise<TokenSet> {
		try {
			const redirectUris = this.config.clientMetadata().redirect_uris as
				| string[]
				| undefined
			const redirectUri = (redirectUris ? redirectUris[0] : '') as string
			
			// Ensure code is properly formatted
			code = code.trim()
			if (code.endsWith('@')) {
				// Handle the @ character at the end which might cause encoding issues
				code = code.slice(0, -1) + '%40'
			}
			
			// Get token endpoint and credentials
			const tokenEndpoint = this.config.serverMetadata().token_endpoint!
			const clientId = this.config.clientMetadata().client_id
			const clientSecret = this.config.clientMetadata().client_secret as string

			// Make direct token request (compatible with Cloudflare Workers environment)
			const tokenData = await this.makeTokenRequest(tokenEndpoint, {
				grant_type: 'authorization_code',
				code,
				redirect_uri: redirectUri
			}, clientId, clientSecret);
			
			const data = this.mapTokenSet(tokenData);
			await this.saveFn?.(data);
			return data;
		} catch (error) {
			console.error('[ERROR] Failed exchanging code for token:', error);

			// Check for WWW-Authenticate challenge error and add more diagnostics
			if (error && (error as any).name === 'WWWAuthenticateChallengeError') {
				console.error('[ERROR] Authentication challenge error details:', {
					cause: (error as any).cause,
					status: (error as any).status,
					challengeRealm:
						(error as any).cause?.[0]?.parameters?.realm || 'unknown',
				});
			}

			throw error;
		}
	}

	/**
	 * Makes a direct token request to the token endpoint
	 * This approach works across all environments including Cloudflare Workers
	 */
	private async makeTokenRequest(
		tokenEndpoint: string, 
		params: Record<string, string>,
		clientId: string,
		clientSecret: string
	): Promise<oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers> {
		// Create URLSearchParams from the parameters
		const urlParams = new URLSearchParams(params);
		
		// Create proper Basic Auth header value that works in all environments
		let authValue: string;
		try {
			// For browser/Cloudflare environment
			authValue = btoa(`${clientId}:${clientSecret}`);
		} catch (e) {
			// For Node.js environment
			authValue = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
		}
		
		// Make the direct fetch request
		const response = await fetch(tokenEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Accept': 'application/json',
				'Authorization': `Basic ${authValue}`
			},
			body: urlParams
		});
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error('[ERROR] Token request failed', {
				status: response.status,
				statusText: response.statusText,
				error: errorText
			});
			throw new Error(`Token request failed: ${response.status} ${response.statusText} - ${errorText}`);
		}
		
		// Parse the response
		const responseData = await response.json();
		
		// Create a token response object that satisfies the TokenEndpointResponseHelpers interface
		return this.createTokenResponse(responseData);
	}
	
	/**
	 * Creates a token response that satisfies the TokenEndpointResponseHelpers interface
	 */
	private createTokenResponse(data: TokenResponseData): oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers {
		return {
			access_token: data.access_token,
			refresh_token: data.refresh_token,
			expires_in: data.expires_in,
			token_type: data.token_type,
			scope: data.scope,
			// Helper methods required by TokenEndpointResponseHelpers
			claims: () => undefined,
			expiresIn: () => data.expires_in
		} as oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
	}

	private mapTokenSet(ts: oidc.TokenEndpointResponse): TokenSet {
		return {
			accessToken: ts.access_token!,
			refreshToken: ts.refresh_token ?? '',
			expiresAt: ts.expires_in ? Date.now() + ts.expires_in * 1000 : Date.now(),
		}
	}

	private async ensureTokenSet(): Promise<
		oidc.TokenEndpointResponse | undefined
	> {
		if (!this.tokenSet && this.loadFn) {
			const saved = await this.loadFn()
			if (saved) {
				const expiresIn = Math.max(
					0,
					Math.floor((saved.expiresAt - Date.now()) / 1000),
				)
				// Create a TokenEndpointResponse with helpers
				this.tokenSet = this.createTokenResponse({
					access_token: saved.accessToken,
					refresh_token: saved.refreshToken,
					expires_in: expiresIn,
					token_type: 'Bearer'
				});
			}
		}
		return this.tokenSet
	}

	async getTokenData(): Promise<TokenData | null> {
		const ts = await this.ensureTokenSet()
		return ts ? this.mapTokenSet(ts) : null
	}

	async getAccessToken(): Promise<string | null> {
		const data = await this.getTokenData()
		return data?.accessToken ?? null
	}

	supportsRefresh(): boolean {
		return true
	}

	onRefresh(cb: (t: TokenSet) => void): void {
		this.refreshCallbacks.push(cb)
	}

	async refreshIfNeeded(options?: RefreshOptions): Promise<TokenData> {
		const ts = await this.ensureTokenSet()
		if (!ts?.refresh_token) {
			throw new Error('No refresh token available')
		}
		const expiresIn = ts.expires_in
		if (options?.force || expiresIn === undefined || expiresIn <= 60) {
			const result = await this.refresh(ts.refresh_token);
			return result;
		}
		return this.mapTokenSet(ts)
	}

	/**
	 * Refresh tokens using a specific refresh token
	 * Implementation of FullAuthClient interface
	 */
	async refresh(refreshToken: string): Promise<TokenSet> {
		// Store the current token set to restore if needed
		const originalTokenSet = this.tokenSet

		try {
			if (!refreshToken) {
				throw new Error('Refresh token is required')
			}

			// Get token endpoint and credentials for the request
			const tokenEndpoint = this.config.serverMetadata().token_endpoint!
			const clientId = this.config.clientMetadata().client_id
			const clientSecret = this.config.clientMetadata().client_secret as string
			
			// Make direct token request
			const tokenData = await this.makeTokenRequest(tokenEndpoint, {
				grant_type: 'refresh_token',
				refresh_token: refreshToken
			}, clientId, clientSecret);
			
			// Store the new token set
			this.tokenSet = tokenData;
			
			const data = this.mapTokenSet(tokenData);
			await this.saveFn?.(data);
			this.refreshCallbacks.forEach((cb) => cb(data));
			return data;
		} catch (error) {
			// Restore the original token set if refresh fails
			this.tokenSet = originalTokenSet;
			throw error;
		}
	}
}