import { MARKET_DATA } from '../../constants'
import { ErrorResponseSchema } from '../../core/errors'
import { createEndpoint } from '../../core/http'
import {
	GetMarketHoursRequestQueryParamsSchema,
	GetMarketHoursResponseBodySchema,
	GetMarketHoursByMarketIdRequestPathParamsSchema,
	GetMarketHoursByMarketIdRequestQueryParamsSchema,
	GetMarketHoursByMarketIdResponseBodySchema,
} from './schema'

export const getMarketHours = createEndpoint<
	never, // No Path Params
	GetMarketHoursRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetMarketHoursResponseBodySchema, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
>({
	method: 'GET',
	path: MARKET_DATA.MARKET_HOURS.GET_HOURS_FOR_MULTIPLE_MARKETS,
	querySchema: GetMarketHoursRequestQueryParamsSchema,
	responseSchema: GetMarketHoursResponseBodySchema,
	errorSchema: ErrorResponseSchema,
	description: 'Get Market Hours for different markets.',
})

export const getMarketHoursByMarketId = createEndpoint<
	GetMarketHoursByMarketIdRequestPathParamsSchema, // Path Params
	GetMarketHoursByMarketIdRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	GetMarketHoursByMarketIdResponseBodySchema, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
>({
	method: 'GET',
	path: MARKET_DATA.MARKET_HOURS.GET_HOURS_FOR_SINGLE_MARKET,
	pathSchema: GetMarketHoursByMarketIdRequestPathParamsSchema,
	querySchema: GetMarketHoursByMarketIdRequestQueryParamsSchema,
	responseSchema: GetMarketHoursByMarketIdResponseBodySchema,
	errorSchema: ErrorResponseSchema,
	description: 'Get Market Hours for a single market.',
})
