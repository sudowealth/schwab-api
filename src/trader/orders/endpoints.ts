import { TRADER } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import {
	GetOrdersQueryParams,
	GetOrdersResponse,
	GetOrdersByAccountPathParams,
	GetOrdersByAccountQueryParams,
	GetOrdersByAccountResponse,
	PlaceOrderRequestBody,
	PlaceOrderResponse,
	GetOrderByIdPathParams,
	GetOrderByIdResponse,
	CancelOrderResponse,
	ReplaceOrderResponse,
} from './schema'

export const getOrdersMeta: EndpointMetadata<
	never,
	GetOrdersQueryParams,
	never,
	GetOrdersResponse,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.ORDERS.GET_ORDERS,
	querySchema: GetOrdersQueryParams,
	responseSchema: GetOrdersResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get all orders for all accounts.',
}

export const getOrdersByAccountMeta: EndpointMetadata<
	GetOrdersByAccountPathParams,
	GetOrdersByAccountQueryParams,
	never,
	GetOrdersByAccountResponse,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.ORDERS.GET_ORDERS_FOR_ACCOUNT,
	pathSchema: GetOrdersByAccountPathParams,
	querySchema: GetOrdersByAccountQueryParams,
	responseSchema: GetOrdersByAccountResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get all orders for a specific account.',
}

export const placeOrderForAccountMeta: EndpointMetadata<
	GetOrdersByAccountPathParams,
	never,
	PlaceOrderRequestBody,
	PlaceOrderResponse,
	'POST',
	ErrorResponseSchema
> = {
	method: 'POST',
	path: TRADER.ORDERS.PLACE_ORDER,
	pathSchema: GetOrdersByAccountPathParams,
	bodySchema: PlaceOrderRequestBody,
	responseSchema: PlaceOrderResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Place an order for a specific account.',
}

export const getOrderByOrderIdMeta: EndpointMetadata<
	GetOrderByIdPathParams,
	never,
	never,
	GetOrderByIdResponse,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.ORDERS.GET_ORDER,
	pathSchema: GetOrderByIdPathParams,
	responseSchema: GetOrderByIdResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get a specific order by its ID, for a specific account.',
}

export const cancelOrderMeta: EndpointMetadata<
	GetOrderByIdPathParams,
	never,
	never,
	CancelOrderResponse,
	'DELETE',
	ErrorResponseSchema
> = {
	method: 'DELETE',
	path: TRADER.ORDERS.CANCEL_ORDER,
	pathSchema: GetOrderByIdPathParams,
	responseSchema: CancelOrderResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Cancel a specific order for a specific account.',
}

export const replaceOrderMeta: EndpointMetadata<
	GetOrderByIdPathParams,
	never,
	PlaceOrderRequestBody,
	ReplaceOrderResponse,
	'PUT',
	ErrorResponseSchema
> = {
	method: 'PUT',
	path: TRADER.ORDERS.REPLACE_ORDER,
	pathSchema: GetOrderByIdPathParams,
	bodySchema: PlaceOrderRequestBody,
	responseSchema: ReplaceOrderResponse,
	errorSchema: ErrorResponseSchema,
	description:
		'Replace an existing order for an account. The existing order will be replaced by the new order. Once replaced, the old order will be canceled and a new order will be created.',
}
