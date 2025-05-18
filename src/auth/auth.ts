import { OpenIdTokenManager } from './openid-manager'
import {
	type ITokenLifecycleManager,
	buildTokenManager,
} from './token-lifecycle-manager'
import {
	type AuthClientOptions,
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

			const oauthManager = new OpenIdTokenManager(config.oauthConfig)
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
