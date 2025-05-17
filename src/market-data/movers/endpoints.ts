import { MARKET_DATA } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import {
	GetMoversRequestPathParamsSchema,
	GetMoversRequestQueryParamsSchema,
	GetMoversResponseBodySchema,
} from './schema'

export const getMoversMeta: EndpointMetadata<
	GetMoversRequestPathParamsSchema, // Path Params
	GetMoversRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetMoversResponseBodySchema, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.MOVERS.GET_MOVERS,
	pathSchema: GetMoversRequestPathParamsSchema,
	querySchema: GetMoversRequestQueryParamsSchema,
	responseSchema: GetMoversResponseBodySchema,
	errorSchema: ErrorResponseSchema,
	description: 'Get Movers for a specific index.',
}
