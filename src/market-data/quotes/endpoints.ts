import { MARKET_DATA } from '../../constants'
import { ErrorResponseSchema } from '../../core/errors'
import { createEndpoint } from '../../core/http'
import {
	GetQuotesRequestQueryParamsSchema,
	GetQuotesResponseBodySchema,
	GetQuoteBySymbolIdRequestPathParamsSchema,
	GetQuoteBySymbolIdRequestQueryParamsSchema,
} from './schema'

export const getQuotes = createEndpoint<
	never, // No Path Params
	GetQuotesRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetQuotesResponseBodySchema, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
>({
	method: 'GET',
	path: MARKET_DATA.QUOTES.GET_QUOTES, // Using constant instead of hardcoded path
	querySchema: GetQuotesRequestQueryParamsSchema,
	responseSchema: GetQuotesResponseBodySchema,
	errorSchema: ErrorResponseSchema, // Using standard error schema
	description: 'Get Quotes by list of symbols.',
})

export const getQuoteBySymbolId = createEndpoint<
	GetQuoteBySymbolIdRequestPathParamsSchema, // Path Params
	GetQuoteBySymbolIdRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetQuotesResponseBodySchema, // Response Body (reusing from /quotes)
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
>({
	method: 'GET',
	path: MARKET_DATA.QUOTES.GET_QUOTE,
	pathSchema: GetQuoteBySymbolIdRequestPathParamsSchema,
	querySchema: GetQuoteBySymbolIdRequestQueryParamsSchema,
	responseSchema: GetQuotesResponseBodySchema, // Reusing the schema from /quotes endpoint response
	errorSchema: ErrorResponseSchema, // Using standard error schema
	description: 'Get Quote by a single symbol.',
})
