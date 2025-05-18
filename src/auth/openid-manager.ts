import * as oidc from 'openid-client'
import { API_URLS, API_VERSIONS } from '../constants'
import {
	type AuthClientOptions,
	type ITokenLifecycleManager,
	type TokenData,
	type TokenSet,
	type RefreshOptions,
} from './types'

export interface OpenIdManagerOptions extends AuthClientOptions {
	issuerBaseUrl?: string
}

export class OpenIdTokenManager implements ITokenLifecycleManager {
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
		const redirectUris = this.config.clientMetadata().redirect_uris as
			| string[]
			| undefined
		const redirectUri = (redirectUris ? redirectUris[0] : '') as string
		const url = new URL(redirectUri)
		url.searchParams.set('code', code)
		this.tokenSet = await oidc.authorizationCodeGrant(this.config, url)
		const data = this.mapTokenSet(this.tokenSet)
		await this.saveFn?.(data)
		return data
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
				this.tokenSet = {
					access_token: saved.accessToken,
					refresh_token: saved.refreshToken,
					expires_in: expiresIn,
				} as any
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
			this.tokenSet = await oidc.refreshTokenGrant(
				this.config,
				ts.refresh_token,
			)
			const data = this.mapTokenSet(this.tokenSet)
			await this.saveFn?.(data)
			this.refreshCallbacks.forEach((cb) => cb(data))
			return data
		}
		return this.mapTokenSet(ts)
	}
}
