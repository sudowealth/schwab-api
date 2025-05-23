/**
 * Central export file for all Zod schemas
 *
 * This file re-exports all schemas from the various modules to provide
 * direct access to schemas without needing to instantiate an API client.
 */

// Utilities
export { mergeShapes } from '../utils/schema-utils'

// --- Base Schemas ---
export { AssetTypeEnum, BaseInstrumentSchema } from './base-instrument.schema'

// Re-export types for TypeScript usage
export type { AssetType, BaseInstrument } from './base-instrument.schema'

// --- Market Data Schemas ---
// Instruments
export {
	InstrumentProjectionEnum,
	GetInstrumentsRequestQueryParamsSchema,
	InstrumentsResponseSchema,
	GetInstrumentByCusipRequestPathParamsSchema,
	GetInstrumentByCusipResponseBodySchema,
} from '../market-data/instruments/schema'

// Market Hours
export {
	MarketHoursMarketQueryEnum,
	GetMarketHoursRequestQueryParamsSchema,
	GetMarketHoursResponseBodySchema,
	GetMarketHoursByMarketIdRequestPathParamsSchema,
	GetMarketHoursByMarketIdRequestQueryParamsSchema,
	GetMarketHoursByMarketIdRequestParamsSchema,
	GetMarketHoursByMarketIdResponseBodySchema,
} from '../market-data/marketHours/schema'

// Movers
export {
	MoversDirectionEnum,
	GetMoversRequestPathParamsSchema,
	GetMoversRequestQueryParamsSchema,
	GetMoversRequestParamsSchema,
	GetMoversResponseBodySchema,
} from '../market-data/movers/schema'

// Options
export {
	ExpirationTypeEnum,
	GetOptionChainRequestQueryParamsSchema,
} from '../market-data/options/schema'

// Price History
export {
	PeriodEnum,
	FrequencyEnum,
	GetPriceHistoryRequestQueryParamsSchema,
} from '../market-data/priceHistory/schema'

// Quotes
export {
	GetQuoteBySymbolIdRequestPathParamsSchema,
	GetQuoteBySymbolIdRequestQueryParamsSchema,
	GetQuoteBySymbolIdRequestParamsSchema,
	GetQuotesRequestQueryParamsSchema,
	GetQuotesResponseBodySchema,
} from '../market-data/quotes/schema'

// Shared
export { InstrumentAssetTypeEnum } from '../market-data/shared/instrument-asset-type.schema'

// --- Trader Schemas ---
// Accounts
export {
	GetAccountByNumberRequestPathParams,
	GetAccountByNumberRequestQueryParams,
	GetAccountByNumberRequestParamsSchema,
	GetAccountByNumberResponseBody,
	GetAccountsRequestQueryParams,
	GetAccountsResponseBody,
	GetAccountNumbersResponseBody,
} from '../trader/accounts/schema'

// Orders
export {
	GetOrdersResponseBody,
	GetOrdersRequestQueryParams,
	GetOrdersByAccountRequestPathParams,
	GetOrdersByAccountRequestQueryParams,
	GetOrdersByAccountRequestParamsSchema,
	PlaceOrderRequestBody,
	PlaceOrderResponseBody,
	GetOrderByOrderIdRequestPathParams,
	GetOrderByOrderIdResponseBody,
	CancelOrderResponseBody,
	ReplaceOrderResponseBody,
} from '../trader/orders/schema'

// Transactions
export {
	TransactionType,
	GetTransactionsRequestPathParams,
	GetTransactionsRequestQueryParams,
	GetTransactionsRequestParamsSchema,
	GetTransactionsResponseBody,
} from '../trader/transactions/schema'

// User Preferences
export { GetUserPreferenceResponseBody } from '../trader/user-preference/schema'

// Shared
export { AccountAPIOptionDeliverable } from '../trader/shared/account-api-option-deliverable.schema'

export { ApiCurrencyType } from '../trader/shared/api-currency-type.schema'

export { assetType } from '../trader/shared/asset-type.schema'
