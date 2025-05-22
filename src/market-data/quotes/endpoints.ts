import { MARKET_DATA } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import {
	GetQuotesRequestQueryParamsSchema,
	GetQuotesResponseBodySchema,
	GetQuoteBySymbolIdRequestPathParamsSchema,
	GetQuoteBySymbolIdRequestQueryParamsSchema,
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
	GetQuotesRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetQuotesResponseBodySchema, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.QUOTES.GET_QUOTES, // Using constant instead of hardcoded path
	querySchema: GetQuotesRequestQueryParamsSchema,
	responseSchema: GetQuotesResponseBodySchema,
	errorSchema: ErrorResponseSchema, // Using standard error schema
	description:
		'Get Quotes by list of symbols with support for partial success (some symbols may return errors).',
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
	GetQuoteBySymbolIdRequestPathParamsSchema, // Path Params
	GetQuoteBySymbolIdRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetQuotesResponseBodySchema, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.QUOTES.GET_QUOTE, // Using constant instead of hardcoded path
	pathSchema: GetQuoteBySymbolIdRequestPathParamsSchema,
	querySchema: GetQuoteBySymbolIdRequestQueryParamsSchema,
	responseSchema: GetQuotesResponseBodySchema,
	errorSchema: ErrorResponseSchema, // Using standard error schema
	description: 'Get Quote for a single symbol ID.',
}
