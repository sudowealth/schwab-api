export * from './urls.js'
export * from './token.js'
export * from './types.js'
export * from './auth-utils.js'
export * from './token-validation.js'

// Primary auth interfaces and factory
export {
	createSchwabAuth,
	AuthStrategy,
	type AuthFactoryConfig,
	type FullAuthClient,
} from './auth.js'

// Export diagnostic utilities for debugging
export * from './auth-diagnostics.js'

// EnhancedTokenManager and related components
export {
	// Main token manager class
	EnhancedTokenManager,
	// Options and configuration
	type EnhancedTokenManagerOptions,
	// Error codes
	TokenErrorCode,
	// Event types
	TokenPersistenceEvent,
	type TokenPersistenceEventHandler,
} from './enhanced-token-manager.js'

// OAuth state utilities
export {
	encodeOAuthState,
	decodeOAuthState,
	validateOAuthState,
	mergeStateWithPKCE,
	extractPKCEFromState,
	createStateWithCSRF,
	verifyStateWithCSRF,
	BasicOAuthStateSchema,
	PKCEOAuthStateSchema,
	type OAuthState,
	type OAuthStateOptions,
} from './oauth-state-utils.js'

// Error mapping utilities
export {
	SchwabErrorMapper,
	defaultErrorMapper,
	mapSchwabError,
	schwabErrorHandler,
	requiresReauthentication,
	getRetryInfo,
	type ErrorMappingResult,
	type ErrorMapper,
} from './error-mapping.js'

// Token storage adapters
export * as adapters from './adapters/index.js'
