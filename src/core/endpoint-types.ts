/**
 * Type utilities for generating endpoint function types from metadata
 */
import { type EndpointMetadata, type SchwabFetchRequestOptions } from './http'

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
				// Access token is always required
				accessToken: string,
				options: BuildEndpointOptions<T>,
			]
		: HasOptionalParams<T> extends true
			? [
					// Access token is always required, options are optional
					accessToken: string,
					options?: BuildEndpointOptions<T>,
				]
			: [
					// Just the access token if no other parameters are needed
					accessToken: string,
				]

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
	getAccountsMeta: any
	getAccountByNumberMeta: any
	getAccountNumbersMeta: any

	// Endpoint functions
	getAccounts: EndpointFunction<any>
	getAccountByNumber: EndpointFunction<any>
	getAccountNumbers: EndpointFunction<any>
}

/**
 * Manually mapped module structure for trader.orders
 */
export interface ProcessedOrders {
	// Metadata objects
	getOrdersMeta: any
	getOrdersByAccountMeta: any
	placeOrderForAccountMeta: any
	getOrderByOrderIdMeta: any
	cancelOrderMeta: any
	replaceOrderMeta: any

	// Endpoint functions
	getOrders: EndpointFunction<any>
	getOrdersByAccount: EndpointFunction<any>
	placeOrderForAccount: EndpointFunction<any>
	getOrderByOrderId: EndpointFunction<any>
	cancelOrder: EndpointFunction<any>
	replaceOrder: EndpointFunction<any>
}

/**
 * Manually mapped module structure for trader.transactions
 */
export interface ProcessedTransactions {
	// Metadata objects
	getTransactionsMeta: any
	getTransactionByIdMeta: any

	// Endpoint functions
	getTransactions: EndpointFunction<any>
	getTransactionById: EndpointFunction<any>
}

/**
 * Manually mapped module structure for trader.userPreference
 */
export interface ProcessedUserPreference {
	// Metadata objects
	getUserPreferenceMeta: any

	// Endpoint functions
	getUserPreference: EndpointFunction<any>
}

/**
 * Manually mapped module structure for marketData.quotes
 */
export interface ProcessedQuotes {
	// Metadata objects
	getQuotesMeta: any
	getQuoteBySymbolIdMeta: any

	// Endpoint functions
	getQuotes: EndpointFunction<any>
	getQuoteBySymbolId: EndpointFunction<any>

	// Utility functions
	extractQuoteErrors: Function
	hasSymbolError: Function
}

/**
 * Manually mapped module structure for marketData.instruments
 */
export interface ProcessedInstruments {
	// Metadata objects
	getInstrumentsMeta: any
	getInstrumentByCusipMeta: any

	// Endpoint functions
	getInstruments: EndpointFunction<any>
	getInstrumentByCusip: EndpointFunction<any>
}

/**
 * Manually mapped module structure for marketData.marketHours
 */
export interface ProcessedMarketHours {
	// Metadata objects
	getMarketHoursMeta: any
	getMarketHoursByMarketIdMeta: any

	// Endpoint functions
	getMarketHours: EndpointFunction<any>
	getMarketHoursByMarketId: EndpointFunction<any>
}

/**
 * Manually mapped module structure for marketData.movers
 */
export interface ProcessedMovers {
	// Metadata objects
	getMoversMeta: any

	// Endpoint functions
	getMovers: EndpointFunction<any>
}

/**
 * Manually mapped module structure for marketData.options
 */
export interface ProcessedOptions {
	// Metadata objects
	getOptionChainMeta: any
	getOptionExpirationChainMeta: any

	// Endpoint functions
	getOptionChain: EndpointFunction<any>
	getOptionExpirationChain: EndpointFunction<any>
}

/**
 * Manually mapped module structure for marketData.priceHistory
 */
export interface ProcessedPriceHistory {
	// Metadata objects
	getPriceHistoryMeta: any

	// Endpoint functions
	getPriceHistory: EndpointFunction<any>
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
