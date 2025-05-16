import { MARKET_DATA } from '../../constants'
import { ErrorResponseSchema } from '../../core/errors'
import { createEndpoint } from '../../core/http'
import {
	GetOptionChainRequestQueryParamsSchema,
	OptionChainSchema,
	GetOptionExpirationChainRequestQueryParamsSchema,
	OptionExpirationChainResponseBodySchema,
} from './schema'

export const getOptionChain = createEndpoint<
	never, // No Path Params
	GetOptionChainRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	OptionChainSchema, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
>({
	method: 'GET',
	path: MARKET_DATA.OPTIONS.GET_OPTION_CHAIN,
	querySchema: GetOptionChainRequestQueryParamsSchema,
	responseSchema: OptionChainSchema,
	errorSchema: ErrorResponseSchema,
	description: 'Get option chain for an optionable symbol.',
})

export const getOptionExpirationChain = createEndpoint<
	never, // No Path Params
	GetOptionExpirationChainRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	OptionExpirationChainResponseBodySchema, // Response Body
	'GET', // HTTP Method
	ErrorResponseSchema // Error type
>({
	method: 'GET',
	path: MARKET_DATA.OPTIONS.GET_OPTION_EXPIRATION_CHAIN,
	querySchema: GetOptionExpirationChainRequestQueryParamsSchema,
	responseSchema: OptionExpirationChainResponseBodySchema,
	errorSchema: ErrorResponseSchema,
	description: 'Get option expiration chain for an optionable symbol.',
})
