import { createEndpoint } from '../../core/http'
import {
	GetMoversRequestPathParamsSchema,
	GetMoversRequestQueryParamsSchema,
	GetMoversResponseBodySchema,
} from './schema'

export const getMovers = createEndpoint<
	GetMoversRequestPathParamsSchema, // Path Params
	GetMoversRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetMoversResponseBodySchema, // Response Body
	'GET', // HTTP Method
	any // Error type
>({
	method: 'GET',
	path: '/market-data/v1/movers/:symbol_id', // As per the screenshot
	pathSchema: GetMoversRequestPathParamsSchema,
	querySchema: GetMoversRequestQueryParamsSchema,
	responseSchema: GetMoversResponseBodySchema,
	description: 'Get Movers for a specific index.',
})
