export * from './endpoints'
export * from './schema'

// Explicitly declare the function type so TypeScript recognizes it
import { 
  type GetOrdersResponseBody, 
  type PlaceOrderResponseBody, 
  type GetOrderByOrderIdResponseBody, 
  type CancelOrderResponseBody, 
  type ReplaceOrderResponseBody 
} from './schema'

export type GetOrdersFunction = () => Promise<GetOrdersResponseBody>
export declare const getOrders: GetOrdersFunction

export type GetOrdersByAccountFunction = (params: { accountNumber: string }) => Promise<GetOrdersResponseBody>
export declare const getOrdersByAccount: GetOrdersByAccountFunction

export type PlaceOrderForAccountFunction = (params: { accountNumber: string }, body: any) => Promise<PlaceOrderResponseBody>
export declare const placeOrderForAccount: PlaceOrderForAccountFunction

export type GetOrderByOrderIdFunction = (params: { accountNumber: string, orderId: number }) => Promise<GetOrderByOrderIdResponseBody>
export declare const getOrderByOrderId: GetOrderByOrderIdFunction

export type CancelOrderFunction = (params: { accountNumber: string, orderId: number }) => Promise<CancelOrderResponseBody>
export declare const cancelOrder: CancelOrderFunction

export type ReplaceOrderFunction = (params: { accountNumber: string, orderId: number }, body: any) => Promise<ReplaceOrderResponseBody>
export declare const replaceOrder: ReplaceOrderFunction
