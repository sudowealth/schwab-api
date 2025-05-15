import { createEndpoint } from '../../core/http'
import {
	GetPriceHistoryRequestQueryParamsSchema,
	GetPriceHistoryResponseBodySchema,
} from './schema'

export const getPriceHistory = createEndpoint<
	never, // No Path Params
	GetPriceHistoryRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetPriceHistoryResponseBodySchema, // Response Body
	'GET', // HTTP Method
	any // Error type
>({
	method: 'GET',
	path: '/marketdata/v1/pricehistory', // As per the screenshot
	querySchema: GetPriceHistoryRequestQueryParamsSchema,
	responseSchema: GetPriceHistoryResponseBodySchema,
	description: 'Get PriceHistory for a single symbol and date ranges.',
})
