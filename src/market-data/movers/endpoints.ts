import { MARKET_DATA } from '../../constants'
import { createEndpointWithContext } from '../../core/http'
import { getSharedContext } from '../../core/shared-context'
import { ErrorResponseSchema } from '../../errors'
import {
	GetMoversRequestPathParamsSchema,
	GetMoversRequestQueryParamsSchema,
	GetMoversResponseBodySchema,
} from './schema'

export const getMovers = createEndpointWithContext<
	GetMoversRequestPathParamsSchema, // Path Params
	GetMoversRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetMoversResponseBodySchema, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
>(getSharedContext(), {
	method: 'GET',
	path: MARKET_DATA.MOVERS.GET_MOVERS,
	pathSchema: GetMoversRequestPathParamsSchema,
	querySchema: GetMoversRequestQueryParamsSchema,
	responseSchema: GetMoversResponseBodySchema,
	errorSchema: ErrorResponseSchema,
	description: 'Get Movers for a specific index.',
})
