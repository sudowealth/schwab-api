import { createEndpoint } from '../../core/http'
import { GetOrdersRequestQueryParams, GetOrdersResponseBody } from './schema'

export const getOrders = createEndpoint<
	never,
	GetOrdersRequestQueryParams,
	never,
	GetOrdersResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/orders',
	querySchema: GetOrdersRequestQueryParams,
	responseSchema: GetOrdersResponseBody,
	description: 'Get all orders for all accounts.',
})
