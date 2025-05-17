import { TRADER } from '../../constants'
import { createRequestContext, createEndpoint } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
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

// Create a default context to use with our endpoints
const context = createRequestContext()

export const getOrders = createEndpoint<
	never,
	GetOrdersRequestQueryParams,
	never,
	GetOrdersResponseBody,
	'GET',
	ErrorResponseSchema
>(context, {
	method: 'GET',
	path: TRADER.ORDERS.GET_ORDERS,
	querySchema: GetOrdersRequestQueryParams,
	responseSchema: GetOrdersResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Get all orders for all accounts.',
})

export const getOrdersByAccount = createEndpoint<
	GetOrdersByAccountRequestPathParams,
	GetOrdersByAccountRequestQueryParams,
	never,
	GetOrdersResponseBody,
	'GET',
	ErrorResponseSchema
>(context, {
	method: 'GET',
	path: TRADER.ORDERS.GET_ORDERS_FOR_ACCOUNT,
	pathSchema: GetOrdersByAccountRequestPathParams,
	querySchema: GetOrdersByAccountRequestQueryParams,
	responseSchema: GetOrdersResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Get all orders for a specific account.',
})

export const placeOrderForAccount = createEndpoint<
	GetOrdersByAccountRequestPathParams,
	never,
	PlaceOrderRequestBody,
	PlaceOrderResponseBody,
	'POST',
	ErrorResponseSchema
>(context, {
	method: 'POST',
	path: TRADER.ORDERS.PLACE_ORDER,
	pathSchema: GetOrdersByAccountRequestPathParams,
	bodySchema: PlaceOrderRequestBody,
	responseSchema: PlaceOrderResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Place an order for a specific account.',
})

export const getOrderByOrderId = createEndpoint<
	GetOrderByOrderIdRequestPathParams,
	never,
	never,
	GetOrderByOrderIdResponseBody,
	'GET',
	ErrorResponseSchema
>(context, {
	method: 'GET',
	path: TRADER.ORDERS.GET_ORDER,
	pathSchema: GetOrderByOrderIdRequestPathParams,
	responseSchema: GetOrderByOrderIdResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Get a specific order by its ID, for a specific account.',
})

export const cancelOrder = createEndpoint<
	GetOrderByOrderIdRequestPathParams,
	never,
	never,
	CancelOrderResponseBody,
	'DELETE',
	ErrorResponseSchema
>(context, {
	method: 'DELETE',
	path: TRADER.ORDERS.CANCEL_ORDER,
	pathSchema: GetOrderByOrderIdRequestPathParams,
	responseSchema: CancelOrderResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Cancel a specific order for a specific account.',
})

export const replaceOrder = createEndpoint<
	GetOrderByOrderIdRequestPathParams,
	never,
	PlaceOrderRequestBody,
	ReplaceOrderResponseBody,
	'PUT',
	ErrorResponseSchema
>(context, {
	method: 'PUT',
	path: TRADER.ORDERS.REPLACE_ORDER,
	pathSchema: GetOrderByOrderIdRequestPathParams,
	bodySchema: PlaceOrderRequestBody,
	responseSchema: ReplaceOrderResponseBody,
	errorSchema: ErrorResponseSchema,
	description:
		'Replace an existing order for an account. The existing order will be replaced by the new order. Once replaced, the old order will be canceled and a new order will be created.',
})
