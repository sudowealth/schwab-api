/**
 * Type utilities for generating endpoint function types from metadata
 */
import { type EndpointMetadata, type SchwabFetchRequestOptions } from './http'
import type {
       getAccountsMeta,
       getAccountByNumberMeta,
       getAccountNumbersMeta,
} from '../trader/accounts/endpoints'
import type {
       getOrdersMeta,
       getOrdersByAccountMeta,
       placeOrderForAccountMeta,
       getOrderByOrderIdMeta,
       cancelOrderMeta,
       replaceOrderMeta,
} from '../trader/orders/endpoints'
import type {
       getTransactionsMeta,
       getTransactionByIdMeta,
} from '../trader/transactions/endpoints'
import type { getUserPreferenceMeta } from '../trader/user-preference/endpoints'
import type {
       getQuotesMeta,
       getQuoteBySymbolIdMeta,
} from '../market-data/quotes/endpoints'
import type {
       getInstrumentsMeta,
       getInstrumentByCusipMeta,
} from '../market-data/instruments/endpoints'
import type {
       getMarketHoursMeta,
       getMarketHoursByMarketIdMeta,
} from '../market-data/marketHours/endpoints'
import type { getMoversMeta } from '../market-data/movers/endpoints'
import type {
       getOptionChainMeta,
       getOptionExpirationChainMeta,
} from '../market-data/options/endpoints'
import type { getPriceHistoryMeta } from '../market-data/priceHistory/endpoints'
import type {
       extractQuoteErrors,
       hasSymbolError,
} from '../market-data/quotes'

/**
 * Extracts parameter types from an EndpointMetadata object
 */
export type ExtractEndpointTypes<T extends EndpointMetadata> = {
	PathParams: T extends EndpointMetadata<infer P, any, any, any, any, any>
		? P
		: never
	QueryParams: T extends EndpointMetadata<any, infer Q, any, any, any, any>
		? Q
		: never
	BodyType: T extends EndpointMetadata<any, any, infer B, any, any, any>
		? B
		: never
	ResponseType: T extends EndpointMetadata<any, any, any, infer R, any, any>
		? R
		: never
	Method: T extends EndpointMetadata<any, any, any, any, infer M, any>
		? M
		: never
	ErrorType: T extends EndpointMetadata<any, any, any, any, any, infer E>
		? E
		: never
}

/**
 * Creates a function type from endpoint metadata
 */
export type EndpointFunction<T extends EndpointMetadata> = (
	...args: EndpointFunctionArgs<T>
) => Promise<ExtractEndpointTypes<T>['ResponseType']>

/**
 * Determines the arguments for an endpoint function based on the metadata
 */
type EndpointFunctionArgs<T extends EndpointMetadata> =
        HasRequiredParams<T> extends true
                ? [
                                options: BuildEndpointOptions<T>,
                        ]
                : HasOptionalParams<T> extends true
                        ? [options?: BuildEndpointOptions<T>]
                        : []

/**
 * Builds the options parameter type based on what's available in the metadata
 */
type BuildEndpointOptions<T extends EndpointMetadata> =
	SchwabFetchRequestOptions<
		ExtractEndpointTypes<T>['PathParams'],
		ExtractEndpointTypes<T>['QueryParams'],
		ExtractEndpointTypes<T>['BodyType']
	>

/**
 * Determines if an endpoint has required parameters
 */
type HasRequiredParams<T extends EndpointMetadata> =
	HasRequiredPathParams<T> extends true
		? true
		: HasRequiredQueryParams<T> extends true
			? true
			: HasRequiredBody<T> extends true
				? true
				: false

/**
 * Determines if an endpoint has any parameters (required or optional)
 */
type HasOptionalParams<T extends EndpointMetadata> =
	HasPathParams<T> extends true
		? true
		: HasQueryParams<T> extends true
			? true
			: HasBody<T> extends true
				? true
				: false

/**
 * Checks if the endpoint has any path parameters
 */
type HasPathParams<T extends EndpointMetadata> =
	ExtractEndpointTypes<T>['PathParams'] extends never
		? false
		: ExtractEndpointTypes<T>['PathParams'] extends unknown
			? false
			: true

/**
 * Checks if the endpoint has any query parameters
 */
type HasQueryParams<T extends EndpointMetadata> =
	ExtractEndpointTypes<T>['QueryParams'] extends never
		? false
		: ExtractEndpointTypes<T>['QueryParams'] extends unknown
			? false
			: true

/**
 * Checks if the endpoint has a body
 */
type HasBody<T extends EndpointMetadata> =
	ExtractEndpointTypes<T>['BodyType'] extends never
		? false
		: ExtractEndpointTypes<T>['BodyType'] extends unknown
			? false
			: true

/**
 * Checks if the endpoint has required path parameters
 * This is a heuristic based on common patterns, as we don't have direct access to the Zod schema details
 */
type HasRequiredPathParams<T extends EndpointMetadata> =
	T['path'] extends `${string}{${string}}${string}`
		? true
		: T['path'] extends `${string}:${string}`
			? true
			: false

/**
 * Checks if the endpoint has required query parameters
 * Without direct access to the Zod schema validation, we can't be certain here
 * so we default to assuming query params are optional
 */
type HasRequiredQueryParams<T extends EndpointMetadata> = false

/**
 * Checks if the endpoint has a required body
 * POST, PUT, and PATCH methods typically require a body
 */
type HasRequiredBody<T extends EndpointMetadata> = T['method'] extends
	| 'POST'
	| 'PUT'
	| 'PATCH'
	? true
	: false

/**
 * A combined type representing both metadata and endpoint function
 * Instead of nesting properties, this makes a flat structure where both exist side by side
 */
export type EndpointPair<M extends EndpointMetadata> = {
	[PropertyKey in keyof M]: M[PropertyKey] // All metadata properties
} & {
	[ignored: string]: EndpointFunction<M> // The endpoint function itself
}

/**
 * Manually mapped module structure for trader.accounts
 */
export interface ProcessedAccounts {
       // Metadata objects
       getAccountsMeta: typeof getAccountsMeta
       getAccountByNumberMeta: typeof getAccountByNumberMeta
       getAccountNumbersMeta: typeof getAccountNumbersMeta

       // Endpoint functions
       getAccounts: EndpointFunction<typeof getAccountsMeta>
       getAccountByNumber: EndpointFunction<typeof getAccountByNumberMeta>
       getAccountNumbers: EndpointFunction<typeof getAccountNumbersMeta>
}

/**
 * Manually mapped module structure for trader.orders
 */
export interface ProcessedOrders {
       // Metadata objects
       getOrdersMeta: typeof getOrdersMeta
       getOrdersByAccountMeta: typeof getOrdersByAccountMeta
       placeOrderForAccountMeta: typeof placeOrderForAccountMeta
       getOrderByOrderIdMeta: typeof getOrderByOrderIdMeta
       cancelOrderMeta: typeof cancelOrderMeta
       replaceOrderMeta: typeof replaceOrderMeta

       // Endpoint functions
       getOrders: EndpointFunction<typeof getOrdersMeta>
       getOrdersByAccount: EndpointFunction<typeof getOrdersByAccountMeta>
       placeOrderForAccount: EndpointFunction<typeof placeOrderForAccountMeta>
       getOrderByOrderId: EndpointFunction<typeof getOrderByOrderIdMeta>
       cancelOrder: EndpointFunction<typeof cancelOrderMeta>
       replaceOrder: EndpointFunction<typeof replaceOrderMeta>
}

/**
 * Manually mapped module structure for trader.transactions
 */
export interface ProcessedTransactions {
       // Metadata objects
       getTransactionsMeta: typeof getTransactionsMeta
       getTransactionByIdMeta: typeof getTransactionByIdMeta

       // Endpoint functions
       getTransactions: EndpointFunction<typeof getTransactionsMeta>
       getTransactionById: EndpointFunction<typeof getTransactionByIdMeta>
}

/**
 * Manually mapped module structure for trader.userPreference
 */
export interface ProcessedUserPreference {
       // Metadata objects
       getUserPreferenceMeta: typeof getUserPreferenceMeta

       // Endpoint functions
       getUserPreference: EndpointFunction<typeof getUserPreferenceMeta>
}

/**
 * Manually mapped module structure for marketData.quotes
 */
export interface ProcessedQuotes {
       // Metadata objects
       getQuotesMeta: typeof getQuotesMeta
       getQuoteBySymbolIdMeta: typeof getQuoteBySymbolIdMeta

       // Endpoint functions
       getQuotes: EndpointFunction<typeof getQuotesMeta>
       getQuoteBySymbolId: EndpointFunction<typeof getQuoteBySymbolIdMeta>

       // Utility functions
       extractQuoteErrors: typeof extractQuoteErrors
       hasSymbolError: typeof hasSymbolError
}

/**
 * Manually mapped module structure for marketData.instruments
 */
export interface ProcessedInstruments {
       // Metadata objects
       getInstrumentsMeta: typeof getInstrumentsMeta
       getInstrumentByCusipMeta: typeof getInstrumentByCusipMeta

       // Endpoint functions
       getInstruments: EndpointFunction<typeof getInstrumentsMeta>
       getInstrumentByCusip: EndpointFunction<typeof getInstrumentByCusipMeta>
}

/**
 * Manually mapped module structure for marketData.marketHours
 */
export interface ProcessedMarketHours {
       // Metadata objects
       getMarketHoursMeta: typeof getMarketHoursMeta
       getMarketHoursByMarketIdMeta: typeof getMarketHoursByMarketIdMeta

       // Endpoint functions
       getMarketHours: EndpointFunction<typeof getMarketHoursMeta>
       getMarketHoursByMarketId: EndpointFunction<typeof getMarketHoursByMarketIdMeta>
}

/**
 * Manually mapped module structure for marketData.movers
 */
export interface ProcessedMovers {
       // Metadata objects
       getMoversMeta: typeof getMoversMeta

       // Endpoint functions
       getMovers: EndpointFunction<typeof getMoversMeta>
}

/**
 * Manually mapped module structure for marketData.options
 */
export interface ProcessedOptions {
       // Metadata objects
       getOptionChainMeta: typeof getOptionChainMeta
       getOptionExpirationChainMeta: typeof getOptionExpirationChainMeta

       // Endpoint functions
       getOptionChain: EndpointFunction<typeof getOptionChainMeta>
       getOptionExpirationChain: EndpointFunction<typeof getOptionExpirationChainMeta>
}

/**
 * Manually mapped module structure for marketData.priceHistory
 */
export interface ProcessedPriceHistory {
       // Metadata objects
       getPriceHistoryMeta: typeof getPriceHistoryMeta

       // Endpoint functions
       getPriceHistory: EndpointFunction<typeof getPriceHistoryMeta>
}

/**
 * Trader namespace with all modules properly typed
 */
export interface ProcessedTraderNamespace {
	accounts: ProcessedAccounts
	orders: ProcessedOrders
	transactions: ProcessedTransactions
	userPreference: ProcessedUserPreference
	shared: any
}

/**
 * Market data namespace with all modules properly typed
 */
export interface ProcessedMarketDataNamespace {
	instruments: ProcessedInstruments
	marketHours: ProcessedMarketHours
	movers: ProcessedMovers
	options: ProcessedOptions
	priceHistory: ProcessedPriceHistory
	quotes: ProcessedQuotes
	shared: any
}

/**
 * A more generic type for processing namespaces - this delegates to our manual type definitions
 * where possible, but falls back to basic type transformation for unknown modules
 */
export type ProcessedNamespace<T> =
	// Using conditionals instead of typeof import() to avoid ESLint warnings
	// The type information is still preserved via our manually defined interfaces
	T extends { getAccountsMeta: any }
		? ProcessedAccounts
		: T extends { getOrdersMeta: any }
			? ProcessedOrders
			: T extends { getTransactionsMeta: any }
				? ProcessedTransactions
				: T extends { getUserPreferenceMeta: any }
					? ProcessedUserPreference
					: T extends { getQuotesMeta: any }
						? ProcessedQuotes
						: T extends { getInstrumentsMeta: any }
							? ProcessedInstruments
							: T extends { getMarketHoursMeta: any }
								? ProcessedMarketHours
								: T extends { getMoversMeta: any }
									? ProcessedMovers
									: T extends { getOptionChainMeta: any }
										? ProcessedOptions
										: T extends { getPriceHistoryMeta: any }
											? ProcessedPriceHistory
											: {
													// Generic fallback that preserves all properties but makes endpoint functions callable
													[K in keyof T]: K extends `${string}Meta`
														? T[K] extends EndpointMetadata
															? EndpointPair<T[K]>
															: T[K]
														: T[K] extends Record<string, any>
															? ProcessedNamespace<T[K]>
															: T[K]
												}

/**
 * Type-safe wrapper for the client object
 */
export type ProcessNamespaceResult<T> =
	// Using presence of key properties instead of typeof import()
	T extends { accounts: any; orders: any; transactions: any }
		? ProcessedTraderNamespace
		: T extends { quotes: any; instruments: any; priceHistory: any }
			? ProcessedMarketDataNamespace
			: {
					[K in keyof T]: T[K] extends Record<string, any>
						? ProcessedNamespace<T[K]>
						: T[K]
				}
