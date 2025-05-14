import { createEndpoint } from '../../core/http'
import {
	GetOrdersRequestQueryParams,
	GetOrdersResponseBody,
	GetOrdersByAccountRequestPathParams,
	GetOrdersByAccountRequestQueryParams,
	PlaceOrderRequestBody,
	PlaceOrderResponseBody,
	GetOrderByOrderIdRequestPathParams,
	GetOrderByOrderIdResponseBody,
	CancelOrderResponseBody,
	ReplaceOrderResponseBody,
} from './schema'

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

export const getOrdersByAccount = createEndpoint<
	never,
	GetOrdersByAccountRequestQueryParams,
	GetOrdersByAccountRequestPathParams,
	GetOrdersResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts/:accountNumber/orders',
	pathSchema: GetOrdersByAccountRequestPathParams,
	querySchema: GetOrdersByAccountRequestQueryParams,
	responseSchema: GetOrdersResponseBody,
	description: 'Get all orders for a specific account.',
})

export const placeOrderForAccount = createEndpoint<
	PlaceOrderRequestBody,
	never,
	GetOrdersByAccountRequestPathParams,
	PlaceOrderResponseBody,
	'POST',
	any
>({
	method: 'POST',
	path: '/trader/v1/accounts/:accountNumber/orders',
	pathSchema: GetOrdersByAccountRequestPathParams,
	bodySchema: PlaceOrderRequestBody,
	responseSchema: PlaceOrderResponseBody,
	description: 'Place an order for a specific account.',
})

export const getOrderByOrderId = createEndpoint<
	never,
	never,
	GetOrderByOrderIdRequestPathParams,
	GetOrderByOrderIdResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/accounts/:accountNumber/orders/:orderId',
	pathSchema: GetOrderByOrderIdRequestPathParams,
	responseSchema: GetOrderByOrderIdResponseBody,
	description: 'Get a specific order by its ID, for a specific account.',
})

export const cancelOrder = createEndpoint<
	never,
	never,
	GetOrderByOrderIdRequestPathParams,
	CancelOrderResponseBody,
	'DELETE',
	any
>({
	method: 'DELETE',
	path: '/trader/v1/accounts/:accountNumber/orders/:orderId',
	pathSchema: GetOrderByOrderIdRequestPathParams,
	responseSchema: CancelOrderResponseBody,
	description: 'Cancel a specific order for a specific account.',
})

export const replaceOrder = createEndpoint<
	PlaceOrderRequestBody,
	never,
	GetOrderByOrderIdRequestPathParams,
	ReplaceOrderResponseBody,
	'PUT',
	any
>({
	method: 'PUT',
	path: '/trader/v1/accounts/:accountNumber/orders/:orderId',
	pathSchema: GetOrderByOrderIdRequestPathParams,
	bodySchema: PlaceOrderRequestBody,
	responseSchema: ReplaceOrderResponseBody,
	description:
		'Replace an existing order for an account. The existing order will be replaced by the new order. Once replaced, the old order will be canceled and a new order will be created.',
})
