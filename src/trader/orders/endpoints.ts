import { OrdersArraySchema, OrdersQuerySchema } from '../../schemas'
import { createEndpoint } from '../../core/http'
import { z } from 'zod'

export type GetOrdersRequestPathParams = {} // No path params
export type GetOrdersRequestQueryParams = z.infer<typeof OrdersQuerySchema>
export type GetOrdersResponseBody = z.infer<typeof OrdersArraySchema>

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
	pathSchema: z.object({}), // Empty schema for no path params
	querySchema: OrdersQuerySchema,
	responseSchema: OrdersArraySchema,
	description: 'Get all orders for all accounts.',
})
