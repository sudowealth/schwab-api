import { createEndpoint } from '../../core/http'
import {
	GetOrdersRequestQueryParams,
	GetOrdersRequestPathParams,
	GetOrdersResponseBody,
} from './schema'

export const getOrders = createEndpoint<
	GetOrdersRequestPathParams,
	GetOrdersRequestQueryParams,
	never,
	GetOrdersResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/orders',
	pathSchema: GetOrdersRequestPathParams,
	querySchema: GetOrdersRequestQueryParams,
	responseSchema: GetOrdersResponseBody,
	description: 'Get all orders for all accounts.',
})
