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
	any // Error type (TODO: Define a more specific error schema if available)
>({
	method: 'GET',
	path: '/marketdata/v1/chains',
	querySchema: GetOptionChainRequestQueryParamsSchema,
	responseSchema: OptionChainSchema,
	description: 'Get option chain for an optionable symbol.',
})

export const getOptionExpirationChain = createEndpoint<
	never, // No Path Params
	GetOptionExpirationChainRequestQueryParamsSchema, // Query Params
	never, // No Request Body
	OptionExpirationChainResponseBodySchema, // Response Body
	'GET', // HTTP Method
	any // Error type
>({
	method: 'GET',
	path: '/marketdata/v1/expirationchain',
	querySchema: GetOptionExpirationChainRequestQueryParamsSchema,
	responseSchema: OptionExpirationChainResponseBodySchema,
	description: 'Get option expiration chain for an optionable symbol.',
})
