import { MARKET_DATA } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import { GetPriceHistoryQueryParams, GetPriceHistoryResponse } from './schema'

export const getPriceHistoryMeta: EndpointMetadata<
	never, // No Path Params
	GetPriceHistoryQueryParams, // Query Params
	never, // No Request Body
	GetPriceHistoryResponse, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.PRICE_HISTORY.GET_PRICE_HISTORY,
	querySchema: GetPriceHistoryQueryParams,
	responseSchema: GetPriceHistoryResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get price history for a symbol.',
}
