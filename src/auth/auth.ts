import { EnhancedTokenManager } from './enhanced-token-manager'
import { OpenIdTokenManager } from './openid-manager'
import {
	type ITokenLifecycleManager,
	buildTokenManager,
} from './token-lifecycle-manager'
import { type AuthClientOptions, type FullAuthClient } from './types'

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
	 * Enhanced OAuth 2.0 code flow authentication
	 * - More robust token persistence and refresh capabilities
	 * - Includes retry logic, automatic reconnection, and token validation
	 * - Comprehensive error handling and debugging tools
	 */
	ENHANCED = 'enhanced',

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
export function createSchwabAuth(config: AuthFactoryConfig): FullAuthClient {
	const strategy = config.strategy.toLowerCase()

	switch (strategy) {
		case AuthStrategy.CODE_FLOW.toLowerCase():
			if (!config.oauthConfig) {
				throw new Error('oauthConfig is required for CODE_FLOW strategy')
			}

			const oauthManager = new OpenIdTokenManager(config.oauthConfig)
			return oauthManager as unknown as FullAuthClient

		case AuthStrategy.ENHANCED.toLowerCase():
			if (!config.oauthConfig) {
				throw new Error('oauthConfig is required for ENHANCED strategy')
			}

			// Create the enhanced token manager with the same OAuth config
			const enhancedManager = new EnhancedTokenManager(config.oauthConfig)
			return enhancedManager as unknown as FullAuthClient

		case AuthStrategy.STATIC.toLowerCase():
			if (!config.accessToken) {
				throw new Error('accessToken is required for STATIC strategy')
			}

			// Static tokens can't exchange code or refresh
			const staticManager = buildTokenManager(config.accessToken)
			// Cast to FullAuthClient but with limited functionality
			return {
				...staticManager,
				getAuthorizationUrl: () => {
					throw new Error(
						'getAuthorizationUrl is not supported with static tokens',
					)
				},
				exchangeCode: () => {
					throw new Error('exchangeCode is not supported with static tokens')
				},
				refresh: () => {
					throw new Error('refresh is not supported with static tokens')
				},
			} as FullAuthClient

		case AuthStrategy.CUSTOM.toLowerCase():
			if (!config.tokenManager) {
				throw new Error('tokenManager is required for CUSTOM strategy')
			}

			// Cast to FullAuthClient but let the caller handle missing methods
			return buildTokenManager(config.tokenManager) as unknown as FullAuthClient

		default:
			throw new Error(`Unknown authentication strategy: ${config.strategy}`)
	}
}
