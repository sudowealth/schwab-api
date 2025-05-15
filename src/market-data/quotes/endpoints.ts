import { createEndpoint } from '../../core/http'
import {
	GetQuotesRequestQueryParamsSchema,
	GetQuotesResponseBodySchema,
	GetQuoteBySymbolIdRequestPathParamsSchema,
	GetQuoteBySymbolIdRequestQueryParamsSchema,
	// GetQuoteBySymbolIdResponseBodySchema is an alias to GetQuotesResponseBodySchema, so no need to import separately if using GetQuotesResponseBodySchema directly
} from './schema'

export const getQuotes = createEndpoint<
	never, // No Path Params
	GetQuotesRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetQuotesResponseBodySchema, // Response Body
	'GET', // HTTP Method
	any // Error type
>({
	method: 'GET',
	path: '/quotes', // As per the screenshot (top left implies /quotes)
	querySchema: GetQuotesRequestQueryParamsSchema,
	responseSchema: GetQuotesResponseBodySchema,
	description: 'Get Quotes by list of symbols.',
})

export const getQuoteBySymbolId = createEndpoint<
	GetQuoteBySymbolIdRequestPathParamsSchema, // Path Params
	GetQuoteBySymbolIdRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetQuotesResponseBodySchema, // Response Body (reusing from /quotes)
	'GET', // HTTP Method
	any // Error type
>({
	method: 'GET',
	path: '/{symbolId}/quotes',
	pathSchema: GetQuoteBySymbolIdRequestPathParamsSchema,
	querySchema: GetQuoteBySymbolIdRequestQueryParamsSchema,
	responseSchema: GetQuotesResponseBodySchema, // Reusing the schema from /quotes endpoint response
	description: 'Get Quote by a single symbol.',
})
