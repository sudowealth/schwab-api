export * from './endpoints.js'
export * from './schema.js'

import { type EndpointFunction } from '../../core/endpoint-types.js'
import {
	type cancelOrderMeta,
	type getOrderByOrderIdMeta,
	type getOrdersByAccountMeta,
	type getOrdersMeta,
	type placeOrderForAccountMeta,
	type replaceOrderMeta,
} from './endpoints.js'

export type GetOrdersFunction = EndpointFunction<typeof getOrdersMeta>
export declare const getOrders: GetOrdersFunction

export type GetOrdersByAccountFunction = EndpointFunction<
	typeof getOrdersByAccountMeta
>
export declare const getOrdersByAccount: GetOrdersByAccountFunction

export type PlaceOrderForAccountFunction = EndpointFunction<
	typeof placeOrderForAccountMeta
>
export declare const placeOrderForAccount: PlaceOrderForAccountFunction

export type GetOrderByOrderIdFunction = EndpointFunction<
	typeof getOrderByOrderIdMeta
>
export declare const getOrderByOrderId: GetOrderByOrderIdFunction

export type CancelOrderFunction = EndpointFunction<typeof cancelOrderMeta>
export declare const cancelOrder: CancelOrderFunction

export type ReplaceOrderFunction = EndpointFunction<typeof replaceOrderMeta>
export declare const replaceOrder: ReplaceOrderFunction
