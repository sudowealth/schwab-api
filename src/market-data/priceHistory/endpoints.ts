import { MARKET_DATA } from '../../constants'
import { createEndpoint } from '../../core/http'
import { getSharedContext } from '../../core/shared-context'
import { ErrorResponseSchema } from '../../errors'
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
	ErrorResponseSchema // Error type
>(getSharedContext(), {
	method: 'GET',
	path: MARKET_DATA.PRICE_HISTORY.GET_PRICE_HISTORY,
	querySchema: GetPriceHistoryRequestQueryParamsSchema,
	responseSchema: GetPriceHistoryResponseBodySchema,
	errorSchema: ErrorResponseSchema,
	description: 'Get PriceHistory for a single symbol and date ranges.',
})
