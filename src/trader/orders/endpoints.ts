import { TRADER } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
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

export const getOrdersMeta: EndpointMetadata<
	never,
	GetOrdersRequestQueryParams,
	never,
	GetOrdersResponseBody,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.ORDERS.GET_ORDERS,
	querySchema: GetOrdersRequestQueryParams,
	responseSchema: GetOrdersResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Get all orders for all accounts.',
}

export const getOrdersByAccountMeta: EndpointMetadata<
	GetOrdersByAccountRequestPathParams,
	GetOrdersByAccountRequestQueryParams,
	never,
	GetOrdersResponseBody,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.ORDERS.GET_ORDERS_FOR_ACCOUNT,
	pathSchema: GetOrdersByAccountRequestPathParams,
	querySchema: GetOrdersByAccountRequestQueryParams,
	responseSchema: GetOrdersResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Get all orders for a specific account.',
}

export const placeOrderForAccountMeta: EndpointMetadata<
	GetOrdersByAccountRequestPathParams,
	never,
	PlaceOrderRequestBody,
	PlaceOrderResponseBody,
	'POST',
	ErrorResponseSchema
> = {
	method: 'POST',
	path: TRADER.ORDERS.PLACE_ORDER,
	pathSchema: GetOrdersByAccountRequestPathParams,
	bodySchema: PlaceOrderRequestBody,
	responseSchema: PlaceOrderResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Place an order for a specific account.',
}

export const getOrderByOrderIdMeta: EndpointMetadata<
	GetOrderByOrderIdRequestPathParams,
	never,
	never,
	GetOrderByOrderIdResponseBody,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.ORDERS.GET_ORDER,
	pathSchema: GetOrderByOrderIdRequestPathParams,
	responseSchema: GetOrderByOrderIdResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Get a specific order by its ID, for a specific account.',
}

export const cancelOrderMeta: EndpointMetadata<
	GetOrderByOrderIdRequestPathParams,
	never,
	never,
	CancelOrderResponseBody,
	'DELETE',
	ErrorResponseSchema
> = {
	method: 'DELETE',
	path: TRADER.ORDERS.CANCEL_ORDER,
	pathSchema: GetOrderByOrderIdRequestPathParams,
	responseSchema: CancelOrderResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Cancel a specific order for a specific account.',
}

export const replaceOrderMeta: EndpointMetadata<
	GetOrderByOrderIdRequestPathParams,
	never,
	PlaceOrderRequestBody,
	ReplaceOrderResponseBody,
	'PUT',
	ErrorResponseSchema
> = {
	method: 'PUT',
	path: TRADER.ORDERS.REPLACE_ORDER,
	pathSchema: GetOrderByOrderIdRequestPathParams,
	bodySchema: PlaceOrderRequestBody,
	responseSchema: ReplaceOrderResponseBody,
	errorSchema: ErrorResponseSchema,
	description:
		'Replace an existing order for an account. The existing order will be replaced by the new order. Once replaced, the old order will be canceled and a new order will be created.',
}
