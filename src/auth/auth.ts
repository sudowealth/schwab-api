import { BaseTokenHandler } from './token-handler'
import {
	type ITokenLifecycleManager,
	buildTokenManager,
} from './token-lifecycle-manager'
import {
	type AuthClientOptions,
	type TokenSet,
	type TokenData,
	type RefreshOptions,
	type FullAuthClient,
} from './types'

/**
 * Authentication strategy types supported by the auth factory
 */
export enum AuthStrategy {
	/**
	 * OAuth 2.0 code flow authentication
	 * - Requires client ID, client secret, and redirect URI
	 * - Handles code exchange, token refresh, and storage
	 */
	CODE_FLOW = 'codeFlow',

	/**
	 * Static token authentication
	 * - Uses a fixed access token
	 * - No refresh capability
	 */
	STATIC = 'static',

	/**
	 * Custom token lifecycle manager
	 * - Uses a user-provided implementation of ITokenLifecycleManager
	 * - Allows full control over token management
	 */
	CUSTOM = 'custom',
}

/**
 * Configuration options for creating an authentication client
 */
export interface AuthFactoryConfig {
	/**
	 * Authentication strategy to use
	 */
	strategy: AuthStrategy | string

	/**
	 * Static access token (required when strategy is 'static')
	 */
	accessToken?: string

	/**
	 * Custom token lifecycle manager (required when strategy is 'custom')
	 */
	tokenManager?: ITokenLifecycleManager

	/**
	 * OAuth client options (required when strategy is 'codeFlow')
	 */
	oauthConfig?: AuthClientOptions
}

// Re-export the FullAuthClient type for convenience
export type { FullAuthClient }

/**
 * Creates a comprehensive auth client that combines all authentication functionality:
 * - Generate an authorization URL for user login
 * - Exchange authorization codes for tokens
 * - Refresh tokens when needed
 *
 * This is the recommended approach for most applications, providing a simplified
 * interface for the complete OAuth flow.
 *
 * ## Token Refresh Handling
 *
 * Schwab refresh tokens expire after 7 days. When this happens, your application will
 * receive a `TOKEN_EXPIRED` error when attempting to refresh. When this occurs, you must
 * initiate a new authorization flow by:
 *
 * 1. Capturing the `SchwabAuthError` with code 'TOKEN_EXPIRED'
 * 2. Redirecting the user to re-authenticate using the authorization URL
 * 3. Exchanging the new authorization code for new tokens
 *
 * Example error handling:
 * ```typescript
 * try {
 *   const newTokens = await auth.refresh(oldRefreshToken);
 *   // Update stored tokens with newTokens
 * } catch (error) {
 *   if (error instanceof SchwabAuthError && error.code === 'TOKEN_EXPIRED') {
 *     // Refresh token has expired, redirect user to re-authenticate
 *     const { authUrl } = auth.getAuthorizationUrl();
 *     // Redirect user to authUrl
 *   } else {
 *     // Handle other errors
 *   }
 * }
 * ```
 */
export function createSchwabAuthClient(
	opts: AuthClientOptions,
): FullAuthClient {
	// Create an instance of the BaseTokenHandler
	const handler = new BaseTokenHandler(opts)

	// Return a unified interface that provides a simpler API
	return {
		// Simple wrapper for exchangeCode
		async exchangeCode(code: string): Promise<TokenSet> {
			return handler.exchangeCode(code)
		},

		// Simple wrapper for refreshTokens
		async refresh(
			refreshToken: string,
			options?: { force?: boolean },
		): Promise<TokenSet> {
			return handler.refreshTokens({
				refreshToken,
				force: options?.force,
			})
		},

		// Pass through the authorization URL generator
		getAuthorizationUrl: handler.getAuthorizationUrl.bind(handler),

		// Pass through load if available
		load: opts.load,

		// Pass through the onRefresh hook
		onRefresh: handler.onRefresh.bind(handler),
	}
}

/**
 * Token manager for OAuth flow that uses the integrated auth client.
 * This class leverages BaseTokenHandler's implementation of ITokenLifecycleManager
 * and focuses on delegating to the auth client.
 */
class OAuthTokenManager extends BaseTokenHandler {
	private authClient: ReturnType<typeof createSchwabAuthClient>

	constructor(options: AuthClientOptions) {
		super(options)
		this.authClient = createSchwabAuthClient(options)
	}

	/**
	 * Exchange an authorization code for tokens
	 * Uses the authClient for code exchange
	 */
	async exchangeCode(code: string): Promise<TokenSet> {
		this.tokenSet = await this.authClient.exchangeCode(code)
		// Update refresh token created timestamp
		this.refreshTokenCreatedAt = Date.now()
		return this.tokenSet
	}

	/**
	 * Register a callback for token refresh events
	 * Delegates to both BaseTokenHandler and authClient
	 */
	onRefresh(callback: (tokenSet: TokenSet) => void): void {
		// Register with the base handler
		super.onRefresh(callback)
		// Also register with the auth client
		this.authClient.onRefresh?.(callback)
	}

	/**
	 * Refreshes tokens using the auth client's refresh method
	 * Provides a simplified interface compared to the base implementation
	 */
	async refreshIfNeeded(options?: RefreshOptions): Promise<TokenData> {
		// Get current tokens
		const currentTokens = await this.getTokenData()

		if (!currentTokens || !currentTokens.refreshToken) {
			throw new Error('No refresh token available')
		}

		// Refresh the tokens through the auth client
		this.tokenSet = await this.authClient.refresh(currentTokens.refreshToken, {
			force: options?.force,
		})

		return {
			accessToken: this.tokenSet.accessToken,
			refreshToken: this.tokenSet.refreshToken,
			expiresAt: this.tokenSet.expiresAt,
		}
	}
}

/**
 * Creates a unified authentication client that handles various authentication strategies
 *
 * This function simplifies authentication by providing a consistent interface
 * regardless of the chosen authentication method.
 *
 * @example
 * ```typescript
 * // Example 1: OAuth Code Flow
 * const auth = createSchwabAuth({
 *   strategy: AuthStrategy.CODE_FLOW,
 *   oauthConfig: {
 *     clientId: 'your-client-id',
 *     clientSecret: 'your-client-secret',
 *     redirectUri: 'your-redirect-uri',
 *     // Optional storage callbacks
 *     save: async (tokens) => localStorage.setItem('tokens', JSON.stringify(tokens)),
 *     load: async () => JSON.parse(localStorage.getItem('tokens') || 'null')
 *   }
 * });
 *
 * // Get authorization URL
 * const { authUrl } = auth.getAuthorizationUrl();
 * // Exchange code for tokens
 * const tokens = await auth.exchangeCode('authorization-code');
 * ```
 *
 * @example
 * ```typescript
 * // Example 2: Static Token
 * const auth = createSchwabAuth({
 *   strategy: AuthStrategy.STATIC,
 *   accessToken: 'your-access-token'
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Example 3: Custom Token Manager
 * const auth = createSchwabAuth({
 *   strategy: AuthStrategy.CUSTOM,
 *   tokenManager: myCustomTokenManager
 * });
 * ```
 */
export function createSchwabAuth(
	config: AuthFactoryConfig,
): ITokenLifecycleManager {
	const strategy = config.strategy.toLowerCase()

	switch (strategy) {
		case AuthStrategy.CODE_FLOW.toLowerCase():
			if (!config.oauthConfig) {
				throw new Error('oauthConfig is required for CODE_FLOW strategy')
			}

			const oauthManager = new OAuthTokenManager(config.oauthConfig)
			return buildTokenManager(oauthManager) as ITokenLifecycleManager

		case AuthStrategy.STATIC.toLowerCase():
			if (!config.accessToken) {
				throw new Error('accessToken is required for STATIC strategy')
			}

			return buildTokenManager(config.accessToken) as ITokenLifecycleManager

		case AuthStrategy.CUSTOM.toLowerCase():
			if (!config.tokenManager) {
				throw new Error('tokenManager is required for CUSTOM strategy')
			}

			return buildTokenManager(config.tokenManager) as ITokenLifecycleManager

		default:
			throw new Error(`Unknown authentication strategy: ${config.strategy}`)
	}
}
