import { z } from 'zod'
import { MARKET_DATA } from '../../constants'
import { ErrorResponseSchema } from '../../core/errors'
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
	ErrorResponseSchema // Error type
>({
	method: 'GET',
	path: `${MARKET_DATA.MOVERS.GET_MOVERS}/:symbolId`, // Using constant instead of hardcoded path
	pathSchema: GetMoversRequestPathParamsSchema,
	querySchema: GetMoversRequestQueryParamsSchema,
	responseSchema: GetMoversResponseBodySchema,
	errorSchema: ErrorResponseSchema,
	description: 'Get Movers for a specific index.',
})
