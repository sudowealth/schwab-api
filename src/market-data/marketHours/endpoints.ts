import { MARKET_DATA } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import {
	GetMarketHoursRequestQueryParamsSchema,
	GetMarketHoursResponseBodySchema,
	GetMarketHoursByMarketIdRequestPathParamsSchema,
	GetMarketHoursByMarketIdRequestQueryParamsSchema,
	GetMarketHoursByMarketIdResponseBodySchema,
} from './schema'

export const getMarketHoursMeta: EndpointMetadata<
	never, // No Path Params
	GetMarketHoursRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetMarketHoursResponseBodySchema, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.MARKET_HOURS.GET_HOURS_FOR_MULTIPLE_MARKETS,
	querySchema: GetMarketHoursRequestQueryParamsSchema,
	responseSchema: GetMarketHoursResponseBodySchema,
	errorSchema: ErrorResponseSchema,
	description: 'Get Market Hours for different markets.',
}

export const getMarketHoursByMarketIdMeta: EndpointMetadata<
	GetMarketHoursByMarketIdRequestPathParamsSchema, // Path Params
	GetMarketHoursByMarketIdRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetMarketHoursByMarketIdResponseBodySchema, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
> = {
	method: 'GET',
	path: MARKET_DATA.MARKET_HOURS.GET_HOURS_FOR_SINGLE_MARKET,
	pathSchema: GetMarketHoursByMarketIdRequestPathParamsSchema,
	querySchema: GetMarketHoursByMarketIdRequestQueryParamsSchema,
	responseSchema: GetMarketHoursByMarketIdResponseBodySchema,
	errorSchema: ErrorResponseSchema,
	description: 'Get Market Hour for a specific market.',
}
