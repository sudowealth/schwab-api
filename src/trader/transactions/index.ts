export * from './endpoints'
export * from './schema'

import { type EndpointFunction } from '../../core/endpoint-types'
import {
	type getTransactionByIdMeta,
	type getTransactionsMeta,
} from './endpoints'

export type GetTransactionsFunction = EndpointFunction<
	typeof getTransactionsMeta
>
export declare const getTransactions: GetTransactionsFunction

export type GetTransactionByIdFunction = EndpointFunction<
	typeof getTransactionByIdMeta
>
export declare const getTransactionById: GetTransactionByIdFunction
