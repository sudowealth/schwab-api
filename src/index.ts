// Public surface of the schwab-api package

// Import specific error types for re-export
import { type SchwabApiLogger } from './core/config.js'
import {
	SchwabApiError,
	isSchwabApiError,
	SchwabAuthError,
	isAuthError,
	SchwabError,
	isSchwabError,
	AuthErrorCode,
} from './errors.js'

// Import the SchwabApiLogger type for re-export

/**
 * INTERNAL NAMESPACES
 *
 * These exports are for internal use only and should not be directly imported by consumers.
 * The recommended approach is to use the `createApiClient` function and access namespaces
 * through the returned client object.
 *
 * @internal
 * @private
 */
export * as auth from './auth/index.js'
export * as marketData from './market-data/index.js'
export * as trader from './trader/index.js'
export * as schemas from './schemas/index.js'
export * as errors from './errors.js'

/**
 * PUBLIC API
 *
 * These exports are the stable public API of the package.
 * Directly export core error types for convenience and backward compatibility.
 */
export {
	AuthErrorCode,
	SchwabError,
	isSchwabError,
	SchwabApiError,
	isSchwabApiError,
	SchwabAuthError,
	isAuthError,
	type SchwabApiLogger,
}

/**
 * API Client
 *
 * The main entry point for using the Schwab API. The createApiClient function
 * creates a configured API client that can be used to make API calls.
 *
 * You can provide authentication in multiple ways:
 * - Use a static token string for simple scripts
 * - Use an object implementing ITokenLifecycleManager
 * - Use the built-in OAuth flow with createSchwabAuth
 */
export {
	createApiClient,
	type SchwabApiClient,
	type CreateApiClientOptions,
} from './create-api-client.js'

/**
 * Configuration Constants
 *
 * These exports provide configuration constants for the Schwab API.
 * Use ENVIRONMENTS and Environment type to specify the API environment.
 */
export { ENVIRONMENTS, type Environment } from './constants.js'

/**
 * Authentication Modules
 *
 * These exports provide tools for handling OAuth authentication with Schwab.
 * You can use these to implement the full OAuth flow with authorization URL
 * generation, code exchange, and token refresh.
 *
 * For most applications, use createSchwabAuth for a unified approach.
 */
export type { TokenData } from './auth/types.js'

// Explicitly export createSchwabAuth, AuthStrategy, AND FullAuthClient from './auth/index.js'
export {
	createSchwabAuth,
	AuthStrategy,
	type FullAuthClient,
	type AuthFactoryConfig,
} from './auth/index.js'

/**
 * Token Management Utilities
 *
 * These exports provide utilities for token lifecycle management.
 * Use these interfaces and classes to create and manage tokens
 * for authentication with the Schwab API.
 */
export {
	// Core interfaces
	type ITokenLifecycleManager,
	// Helper functions
	isTokenLifecycleManager,
} from './auth/token-lifecycle-manager.js'

/**
 * Enhanced Token Management
 *
 * Export the EnhancedTokenManager for applications requiring
 * robust token management capabilities
 */
export {
	EnhancedTokenManager,
	type EnhancedTokenManagerOptions,
	TokenErrorCode,
	TokenPersistenceEvent,
	type TokenPersistenceEventHandler,
} from './auth/enhanced-token-manager.js'

/**
 * Authentication Utilities
 *
 * Utility functions for authentication and encoding operations
 */
export { safeBase64Encode, safeBase64Decode } from './auth/auth-utils.js'

/**
 * OAuth State Management
 *
 * Utilities for managing OAuth state parameters
 */
export {
	encodeOAuthState,
	decodeOAuthState,
	validateOAuthState,
	mergeStateWithPKCE,
	extractPKCEFromState,
	createStateWithCSRF,
	verifyStateWithCSRF,
	extractClientIdFromState,
	decodeAndVerifyState,
	BasicOAuthStateSchema,
	PKCEOAuthStateSchema,
	type OAuthState,
	type OAuthStateOptions,
} from './auth/oauth-state-utils.js'

/**
 * Token Storage Adapters
 *
 * Pre-built storage adapters for various platforms
 */
export {
	KVTokenStore,
	createKVTokenStore,
} from './auth/adapters/kv-token-store.js'
export type {
	KVNamespace,
	TokenIdentifiers,
} from './auth/adapters/kv-token-store.js'

/**
 * Cookie-based Token Storage
 *
 * Secure token persistence using signed cookies
 */
export {
	CookieTokenStore,
	createCookieTokenStore,
	type CookieTokenStoreOptions,
} from './auth/adapters/cookie-token-store.js'

/**
 * Account Privacy Utilities
 *
 * Tools for scrubbing sensitive account information
 */
export {
	buildAccountDisplayMap,
	scrubAccountIdentifiers,
	createAccountScrubber,
} from './utils/account-scrubber.js'

/**
 * Secure Logging Utilities
 *
 * Enhanced logging with automatic secret redaction
 */
export {
	sanitizeKeyForLog,
	sanitizeError,
	sanitizeTokenForLog,
} from './utils/secure-logger.js'

/**
 * Cryptographic Utilities
 *
 * Tools for signing and verifying data
 */
export {
	createHmacKey,
	signData,
	verifySignature,
	toHex,
	fromHex,
} from './utils/crypto-utils.js'

/**
 * Error Mapping Utilities
 *
 * Tools for mapping Schwab errors to HTTP responses
 */
export {
	SchwabErrorMapper,
	defaultErrorMapper,
	mapSchwabError,
	schwabErrorHandler,
	requiresReauthentication,
	getRetryInfo,
	type ErrorMappingResult,
	type ErrorMapper,
} from './auth/error-mapping.js'

/**
 * Public Middleware Components
 *
 * These exports provide middleware components that can be used to customize
 * the API client's request pipeline. You can use these to add functionality
 * like authentication, rate limiting and retries.
 */
// Middleware type and compose function
export { type Middleware, compose } from './middleware/compose.js'

// Middleware functions
export {
	withTokenAuth,
	type TokenAuthOptions,
} from './middleware/with-token-auth.js'
export {
	withRateLimit,
	type RateLimitOptions,
} from './middleware/with-rate-limit.js'
export { withRetry, type RetryOptions } from './middleware/with-retry.js'

/**
 * Public Schema Exports
 *
 * These exports provide direct access to the Zod schemas used
 * for validation within the package. These are re-exported from
 * the central schemas module to allow direct imports without
 * creating an API client instance.
 */
export {
	// Base Schemas
	AssetTypeEnum,
	BaseInstrumentSchema,
	// Market Data Schemas
	GetInstrumentsParams,
	GetInstrumentsPathParams,
	GetInstrumentsQueryParams,
	GetInstrumentsResponse,
	GetInstrumentByCusipParams,
	GetInstrumentByCusipPathParams,
	GetInstrumentByCusipQueryParams,
	GetInstrumentByCusipResponse,
	GetMarketHoursByMarketIdParams,
	GetMarketHoursByMarketIdPathParams,
	GetMarketHoursByMarketIdQueryParams,
	GetMarketHoursByMarketIdResponse,
	GetMarketHoursParams,
	GetMarketHoursPathParams,
	GetMarketHoursQueryParams,
	GetMarketHoursResponse,
	GetMoversParams,
	GetMoversPathParams,
	GetMoversQueryParams,
	GetMoversResponse,
	GetOptionChainParams,
	GetOptionChainPathParams,
	GetOptionChainQueryParams,
	GetOptionChainResponse,
	GetOptionExpirationChainParams,
	GetOptionExpirationChainPathParams,
	GetOptionExpirationChainQueryParams,
	GetOptionExpirationChainResponse,
	GetPriceHistoryParams,
	GetPriceHistoryPathParams,
	GetPriceHistoryQueryParams,
	GetPriceHistoryResponse,
	GetQuoteBySymbolIdParams,
	GetQuoteBySymbolIdPathParams,
	GetQuoteBySymbolIdQueryParams,
	GetQuoteBySymbolIdResponse,
	GetQuotesParams,
	GetQuotesPathParams,
	GetQuotesQueryParams,
	GetQuotesResponse,
	ExpirationTypeEnum,
	FrequencyEnum,
	InstrumentAssetTypeEnum,
	InstrumentProjectionEnum,
	MarketHoursMarketQueryEnum,
	MoversDirectionEnum,
	PeriodEnum,
	// Trader Schemas
	CancelOrderParams,
	CancelOrderPathParams,
	CancelOrderQueryParams,
	CancelOrderResponse,
	GetAccountByNumberParams,
	GetAccountByNumberPathParams,
	GetAccountByNumberQueryParams,
	GetAccountByNumberResponse,
	GetAccountNumbersParams,
	GetAccountNumbersPathParams,
	GetAccountNumbersQueryParams,
	GetAccountNumbersResponse,
	GetAccountsParams,
	GetAccountsPathParams,
	GetAccountsQueryParams,
	GetAccountsResponse,
	GetOrderByIdParams,
	GetOrderByIdPathParams,
	GetOrderByIdQueryParams,
	GetOrderByIdResponse,
	GetOrdersByAccountParams,
	GetOrdersByAccountPathParams,
	GetOrdersByAccountQueryParams,
	GetOrdersByAccountResponse,
	GetOrdersParams,
	GetOrdersPathParams,
	GetOrdersQueryParams,
	GetOrdersResponse,
	GetTransactionByIdParams,
	GetTransactionByIdPathParams,
	GetTransactionByIdQueryParams,
	GetTransactionByIdResponse,
	GetTransactionsParams,
	GetTransactionsPathParams,
	GetTransactionsQueryParams,
	GetTransactionsResponse,
	GetUserPreferenceParams,
	GetUserPreferencePathParams,
	GetUserPreferenceQueryParams,
	GetUserPreferenceResponse,
	PlaceOrderParams,
	PlaceOrderPathParams,
	PlaceOrderRequestBody,
	PlaceOrderResponse,
	ReplaceOrderParams,
	ReplaceOrderPathParams,
	ReplaceOrderRequestBody,
	ReplaceOrderResponse,
	TransactionType,
	AccountAPIOptionDeliverable,
	ApiCurrencyType,
	assetType,
} from './schemas/index.js'

// Re-export schema types
export type { AssetType, BaseInstrument } from './schemas/index.js'

// Additional utility namespaces
export * as adapters from './auth/adapters/index.js'
export * as cryptoUtils from './utils/crypto-utils.js'
export * as accountUtils from './utils/account-scrubber.js'
