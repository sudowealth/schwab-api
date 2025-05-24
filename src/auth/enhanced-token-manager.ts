import { API_URLS, API_VERSIONS } from '../constants'
import { SchwabAuthError, AuthErrorCode } from '../errors'
import { createLogger } from '../utils/secure-logger'
import {
	getAuthDiagnostics,
	type AuthDiagnosticsOptions,
	type AuthDiagnosticsResult,
} from './auth-diagnostics'
import { sanitizeAuthCode, DEFAULT_REFRESH_THRESHOLD_MS } from './auth-utils'
import { generatePkcePair, buildState, extractVerifier } from './pkce-handler'
import { TokenPersistence } from './token-persistence'
import { TokenRefreshCoordinator } from './token-refresh-coordinator'
import { type TokenRefreshTracer } from './token-refresh-tracer'
import {
	type TokenData,
	type RefreshOptions,
	type AuthClientOptions,
	type FullAuthClient,
	type SchwabTokenResponse,
} from './types'

export enum TokenErrorCode {
	AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
	REFRESH_FAILED = 'REFRESH_FAILED',
}

export enum TokenPersistenceEvent {
	TOKEN_SAVED = 'token_saved',
	TOKEN_SAVE_FAILED = 'token_save_failed',
	TOKEN_LOADED = 'token_loaded',
	TOKEN_LOAD_FAILED = 'token_load_failed',
	TOKEN_VALIDATED = 'token_validated',
	TOKEN_VALIDATION_FAILED = 'token_validation_failed',
}

export type TokenPersistenceEventHandler = (
	event: TokenPersistenceEvent,
	data: TokenData,
	metadata?: Record<string, any>,
) => void

export interface EnhancedTokenManagerOptions extends AuthClientOptions {
	maxRetryAttempts?: number
	initialRetryDelayMs?: number
	maxRetryDelayMs?: number
	useExponentialBackoff?: boolean
	refreshThresholdMs?: number
	debug?: boolean
	validateTokens?: boolean
	autoReconnect?: boolean
	onTokenEvent?: TokenPersistenceEventHandler
	traceOperations?: boolean
	issuerBaseUrl?: string
	tracer?: TokenRefreshTracer
}

export class EnhancedTokenManager implements FullAuthClient {
	private config: Required<
		Omit<
			EnhancedTokenManagerOptions,
			'save' | 'load' | 'onTokenEvent' | 'tracer'
		>
	> & {
		save: AuthClientOptions['save']
		load: AuthClientOptions['load']
		onTokenEvent: TokenPersistenceEventHandler | undefined
		tracer: TokenRefreshTracer | undefined
	}
	private tokenSet?: TokenSet
	private pkce?: { verifier: string; challenge: string }
	private persistence: TokenPersistence
	private refreshCoordinator: TokenRefreshCoordinator

	constructor(options: EnhancedTokenManagerOptions) {
		const baseIssuerUrl =
			options.issuerBaseUrl ?? `${API_URLS.PRODUCTION}/${API_VERSIONS.v1}`
		this.config = {
			clientId: options.clientId,
			clientSecret: options.clientSecret,
			redirectUri: options.redirectUri,
			scope: options.scope || ['api', 'offline_access'],
			fetch: options.fetch || globalThis.fetch.bind(globalThis),
			load: options.load,
			save: options.save,
			maxRetryAttempts: options.maxRetryAttempts ?? 3,
			initialRetryDelayMs: options.initialRetryDelayMs ?? 1000,
			maxRetryDelayMs: options.maxRetryDelayMs ?? 30000,
			useExponentialBackoff: options.useExponentialBackoff !== false,
			refreshThresholdMs:
				options.refreshThresholdMs ?? DEFAULT_REFRESH_THRESHOLD_MS,
			debug: options.debug ?? false,
			validateTokens: options.validateTokens !== false,
			autoReconnect: options.autoReconnect !== false,
			onTokenEvent: options.onTokenEvent,
			traceOperations: options.traceOperations ?? false,
			issuerBaseUrl: baseIssuerUrl,
			tracer: options.tracer,
		}
		this.persistence = new TokenPersistence({
			save: this.config.save,
			load: this.config.load,
			validate: this.config.validateTokens,
			onEvent: this.config.onTokenEvent,
			debug: this.config.debug,
		})
		this.refreshCoordinator = new TokenRefreshCoordinator(
			{ performRefresh: this.performDirectTokenRefresh.bind(this) },
			{
				refreshThresholdMs: this.config.refreshThresholdMs,
				debug: this.config.debug,
				maxRetryAttempts: this.config.maxRetryAttempts,
				initialRetryDelayMs: this.config.initialRetryDelayMs,
				backoffMultiplier: this.config.useExponentialBackoff ? 2 : 1,
				tracer: this.config.tracer,
			},
		)
	}

	async getAuthorizationUrl(opts?: {
		scope?: string[]
		state?: string
	}): Promise<{ authUrl: string; generatedState?: string }> {
		this.pkce = await generatePkcePair()
		const state = buildState(opts?.state, this.pkce.verifier)
		const params = new URLSearchParams({
			client_id: this.config.clientId,
			scope: (opts?.scope || this.config.scope).join(' '),
			response_type: 'code',
			redirect_uri: this.config.redirectUri,
			code_challenge: this.pkce.challenge,
			code_challenge_method: 'S256',
			state,
		})
		const authUrl = `${this.config.issuerBaseUrl}/oauth/authorize?${params.toString()}`
		return { authUrl, generatedState: state }
	}

	async exchangeCode(code: string, stateParam?: string): Promise<TokenSet> {
		const verifier = stateParam
			? extractVerifier(stateParam)
			: this.pkce?.verifier
		if (!verifier) {
			throw new SchwabAuthError(
				AuthErrorCode.PKCE_VERIFIER_MISSING,
				'PKCE verifier missing',
			)
		}
		const params = {
			grant_type: 'authorization_code',
			code: sanitizeAuthCode(code),
			redirect_uri: this.config.redirectUri,
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret,
			code_verifier: verifier,
		}
		const resp = await this.performDirectTokenExchange(params)
		const tokenSet: TokenSet = {
			accessToken: resp.access_token!,
			refreshToken: resp.refresh_token || '',
			expiresAt: Date.now() + (resp.expires_in || 0) * 1000,
		}
		this.tokenSet = tokenSet
		await this.persistence.save(tokenSet, {
			operation: 'code_exchange',
			timestamp: Date.now(),
		})
		return tokenSet
	}

	async getTokenData(): Promise<TokenData | null> {
		if (this.tokenSet) return this.tokenSet
		const loaded = await this.persistence.load()
		if (loaded) {
			this.tokenSet = {
				accessToken: loaded.accessToken,
				refreshToken: loaded.refreshToken || '',
				expiresAt: loaded.expiresAt || Date.now() + 3600 * 1000,
			}
		}
		return this.tokenSet || null
	}

	async getAccessToken(): Promise<string | null> {
		const data = await this.getTokenData()
		return data ? data.accessToken : null
	}

	supportsRefresh(): boolean {
		return true
	}

	async refreshIfNeeded(options?: RefreshOptions): Promise<TokenData> {
		const data = await this.getTokenData()
		const refreshed = await this.refreshCoordinator.refreshIfNeeded(
			data,
			options?.force,
		)
		if (refreshed !== data) {
			const tokenSet: TokenSet = {
				accessToken: refreshed.accessToken,
				refreshToken: refreshed.refreshToken || '',
				expiresAt:
					refreshed.expiresAt ?? Date.now() + this.config.refreshThresholdMs,
			}
			this.tokenSet = tokenSet
			await this.persistence.save(tokenSet, {
				operation: 'refresh',
				timestamp: Date.now(),
			})
		}
		return refreshed
	}

	async refresh(
		refreshToken: string,
		options?: { force?: boolean },
	): Promise<TokenSet> {
		const data = await this.refreshCoordinator.refreshIfNeeded(
			{ accessToken: '', refreshToken, expiresAt: 0 },
			options?.force,
		)
		const tokenSet: TokenSet = {
			accessToken: data.accessToken,
			refreshToken: data.refreshToken || '',
			expiresAt: data.expiresAt ?? Date.now() + this.config.refreshThresholdMs,
		}
		this.tokenSet = tokenSet
		await this.persistence.save(tokenSet, {
			operation: 'refresh',
			timestamp: Date.now(),
		})
		return tokenSet
	}

	onRefresh(callback: (tokenData: TokenSet) => void): void {
		this.refreshCoordinator.onRefresh(callback)
	}

	public async getAuthDiagnostics(
		opts?: AuthDiagnosticsOptions,
	): Promise<AuthDiagnosticsResult> {
		return getAuthDiagnostics(this.persistence, opts)
	}

	async initialize(): Promise<boolean> {
		const data = await this.getTokenData()
		if (!data) return false
		const refreshed = await this.refreshCoordinator.refreshIfNeeded(data)
		return !!refreshed.accessToken
	}

	async saveTokens(
		tokens: Partial<TokenSet>,
		metadata?: Record<string, any>,
	): Promise<void> {
		const set: TokenSet = {
			accessToken: tokens.accessToken || '',
			refreshToken: tokens.refreshToken || '',
			expiresAt: tokens.expiresAt || Date.now() + 3600 * 1000,
		}
		this.tokenSet = set
		await this.persistence.save(set, metadata)
	}

	async clearTokens(): Promise<void> {
		this.tokenSet = undefined
		await this.persistence.save({
			accessToken: '',
			refreshToken: '',
			expiresAt: 0,
		})
	}

	addReconnectionHandler(_handler: () => Promise<void>): void {
		// no-op in simplified refactor
	}

	async triggerReconnection(): Promise<void> {
		// no-op in simplified refactor
	}

	private async performDirectTokenRefresh(
		refreshToken: string,
	): Promise<TokenSet> {
		const params = {
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret,
		}
		const resp = await this.performDirectTokenExchange(params)
		return {
			accessToken: resp.access_token!,
			refreshToken: resp.refresh_token || refreshToken,
			expiresAt: Date.now() + (resp.expires_in || 0) * 1000,
		}
	}

	private async performDirectTokenExchange(
		params: Record<string, string>,
	): Promise<SchwabTokenResponse> {
		const formData = new URLSearchParams()
		Object.entries(params).forEach(([k, v]) => formData.append(k, v))
		const headers: Record<string, string> = {
			'Content-Type': 'application/x-www-form-urlencoded',
		}
		if (params.client_id && params.client_secret) {
			headers.Authorization =
				'Basic ' +
				Buffer.from(`${params.client_id}:${params.client_secret}`).toString(
					'base64',
				)
		}
		const tokenEndpoint = `${this.config.issuerBaseUrl}/oauth/token`
		const resp = await this.config.fetch(tokenEndpoint, {
			method: 'POST',
			headers,
			body: formData.toString(),
		})
		if (!resp.ok) {
			throw new SchwabAuthError(
				AuthErrorCode.UNAUTHORIZED,
				`Token request failed: ${resp.statusText}`,
				resp.status,
			)
		}
		return (await resp.json()) as SchwabTokenResponse
	}
}
