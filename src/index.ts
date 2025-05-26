// Public surface of the schwab-api package

// Import specific error types for re-export
import { type SchwabApiLogger } from './core/config'
import {
	SchwabApiError,
	isSchwabApiError,
	SchwabAuthError,
	SchwabError,
	isSchwabError,
	AuthErrorCode,
} from './errors'

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
export * as auth from './auth'
export * as marketData from './market-data'
export * as trader from './trader'
export * as schemas from './schemas'
export * as errors from './errors'

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
	SchwabApiLogger,
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
} from './create-api-client'

/**
 * Configuration Constants
 *
 * These exports provide configuration constants for the Schwab API.
 * Use ENVIRONMENTS and Environment type to specify the API environment.
 */
export { ENVIRONMENTS, type Environment } from './constants'

/**
 * Authentication Modules
 *
 * These exports provide tools for handling OAuth authentication with Schwab.
 * You can use these to implement the full OAuth flow with authorization URL
 * generation, code exchange, and token refresh.
 *
 * For most applications, use createSchwabAuth for a unified approach.
 */
export type { TokenData } from './auth/types'

// Explicitly export createSchwabAuth, AuthStrategy, AND FullAuthClient from './auth'
export {
	createSchwabAuth,
	AuthStrategy,
	type FullAuthClient,
	type AuthFactoryConfig,
} from './auth'

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
} from './auth/token-lifecycle-manager'

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
} from './auth/enhanced-token-manager'

/**
 * Authentication Utilities
 *
 * Utility functions for authentication and encoding operations
 */
export { safeBase64Encode, safeBase64Decode } from './auth/auth-utils'

/**
 * Public Middleware Components
 *
 * These exports provide middleware components that can be used to customize
 * the API client's request pipeline. You can use these to add functionality
 * like authentication, rate limiting and retries.
 */
// Middleware type and compose function
export { type Middleware, compose } from './middleware/compose'

// Middleware functions
export {
	withTokenAuth,
	type TokenAuthOptions,
} from './middleware/with-token-auth'
export {
	withRateLimit,
	type RateLimitOptions,
} from './middleware/with-rate-limit'
export { withRetry, type RetryOptions } from './middleware/with-retry'

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
	InstrumentProjectionEnum,
	GetInstrumentsRequestQueryParamsSchema,
	InstrumentsResponseSchema,
	GetInstrumentByCusipRequestPathParamsSchema,
	GetInstrumentByCusipResponseBodySchema,
	MarketHoursMarketQueryEnum,
	GetMarketHoursRequestQueryParamsSchema,
	GetMarketHoursResponseBodySchema,
	GetMarketHoursByMarketIdRequestPathParamsSchema,
	GetMarketHoursByMarketIdRequestQueryParamsSchema,
	GetMarketHoursByMarketIdRequestParamsSchema,
	GetMarketHoursByMarketIdResponseBodySchema,
	MoversDirectionEnum,
	GetMoversRequestPathParamsSchema,
	GetMoversRequestQueryParamsSchema,
	GetMoversRequestParamsSchema,
	GetMoversResponseBodySchema,
	ExpirationTypeEnum,
	GetOptionChainRequestQueryParamsSchema,
	PeriodEnum,
	FrequencyEnum,
	GetPriceHistoryRequestQueryParamsSchema,
	GetQuoteBySymbolIdRequestPathParamsSchema,
	GetQuoteBySymbolIdRequestQueryParamsSchema,
	GetQuoteBySymbolIdRequestParamsSchema,
	GetQuotesRequestQueryParamsSchema,
	GetQuotesResponseBodySchema,
	InstrumentAssetTypeEnum,

	// Trader Schemas
	GetAccountByNumberRequestPathParams,
	GetAccountByNumberRequestQueryParams,
	GetAccountByNumberResponseBody,
	GetAccountsRequestQueryParams,
	GetAccountsResponseBody,
	GetAccountNumbersResponseBody,
	GetOrdersResponseBody,
	GetOrdersRequestQueryParams,
	GetOrdersByAccountRequestPathParams,
	GetOrdersByAccountRequestQueryParams,
	PlaceOrderRequestBody,
	PlaceOrderResponseBody,
	GetOrderByOrderIdRequestPathParams,
	GetOrderByOrderIdResponseBody,
	CancelOrderResponseBody,
	ReplaceOrderResponseBody,
	TransactionType,
	GetTransactionsRequestPathParams,
	GetTransactionsRequestQueryParams,
	GetTransactionsResponseBody,
	GetUserPreferenceRequestParams,
	GetUserPreferenceResponseBody,
	AccountAPIOptionDeliverable,
	ApiCurrencyType,
	assetType,
} from './schemas'

// Re-export schema types
export type { AssetType, BaseInstrument } from './schemas'
