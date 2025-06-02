import { MARKET_DATA } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import {
	GetQuotesQueryParams,
	GetQuotesResponse,
	GetQuoteBySymbolIdPathParams,
	GetQuoteBySymbolIdQueryParams,
	GetQuoteBySymbolIdResponse,
} from './schema'

/**
 * Get quotes for multiple symbols.
 *
 * Note on partial success: This endpoint supports partial success responses,
 * meaning that even with a successful HTTP 200 response, some individual symbols
 * might contain error information rather than quote data. Use the `extractQuoteErrors`
 * utility function to easily identify and handle these symbol-level errors.
 *
 * @see extractQuoteErrors
 */
export const getQuotesMeta: EndpointMetadata<
	never, // No Path Params
	GetQuotesQueryParams, // Query Params
	never, // No Request Body
	GetQuotesResponse, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.QUOTES.GET_QUOTES,
	querySchema: GetQuotesQueryParams,
	responseSchema: GetQuotesResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get quotes for one or more symbols.',
}

/**
 * Get a quote for a single symbol.
 *
 * Note on partial success: While this endpoint typically returns data for a single symbol,
 * that symbol may still contain error information rather than quote data if it's invalid.
 * Use the `hasSymbolError` utility function to check for symbol-level errors.
 *
 * @see hasSymbolError
 */
export const getQuoteBySymbolIdMeta: EndpointMetadata<
	GetQuoteBySymbolIdPathParams, // Path Params
	GetQuoteBySymbolIdQueryParams, // Query Params
	never, // No Request Body
	GetQuoteBySymbolIdResponse, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.QUOTES.GET_QUOTE,
	pathSchema: GetQuoteBySymbolIdPathParams,
	querySchema: GetQuoteBySymbolIdQueryParams,
	responseSchema: GetQuoteBySymbolIdResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get quote for a single symbol.',
}
