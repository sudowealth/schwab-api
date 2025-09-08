import { EnhancedTokenManager } from './enhanced-token-manager.js'
import { type AuthClientOptions, type FullAuthClient } from './types.js'

/**
 * Authentication strategy for the auth factory
 * Only the Enhanced strategy is supported in this version
 */
export enum AuthStrategy {
	/**
	 * Enhanced OAuth 2.0 code flow authentication
	 * - Built-in token persistence and refresh capabilities
	 * - Includes retry logic, automatic reconnection, and token validation
	 * - Comprehensive error handling and debugging tools
	 * - Reliable token management for serverless environments
	 */
	ENHANCED = 'enhanced',
}

/**
 * Configuration options for creating an authentication client
 */
export interface AuthFactoryConfig {
	/**
	 * Authentication strategy to use (only ENHANCED is supported)
	 * @default AuthStrategy.ENHANCED
	 */
	strategy?: AuthStrategy | string

	/**
	 * OAuth client options (required)
	 */
	oauthConfig: AuthClientOptions
}

// Re-export the FullAuthClient type for convenience
export type { FullAuthClient }

/**
 * Creates an authentication client using the EnhancedTokenManager
 *
 * @example
 * ```typescript
 * const auth = createSchwabAuth({
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
 */
export function createSchwabAuth(
	config: AuthFactoryConfig,
): EnhancedTokenManager {
	// Check if oauthConfig is provided
	if (!config.oauthConfig) {
		throw new Error('oauthConfig is required')
	}

	// Create the enhanced token manager with the provided OAuth config
	const enhancedManager = new EnhancedTokenManager(config.oauthConfig)
	return enhancedManager
}
