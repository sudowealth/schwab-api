import { MARKET_DATA } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import {
	GetMoversPathParams,
	GetMoversQueryParams,
	GetMoversResponse,
} from './schema'

export const getMoversMeta: EndpointMetadata<
	GetMoversPathParams, // Path Params
	GetMoversQueryParams, // Query Params
	never, // No Request Body
	GetMoversResponse, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.MOVERS.GET_MOVERS,
	pathSchema: GetMoversPathParams,
	querySchema: GetMoversQueryParams,
	responseSchema: GetMoversResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get Movers for a specific index.',
}
