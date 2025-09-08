export * from './endpoints.js'
export * from './schema.js'

import { type EndpointFunction } from '../../core/endpoint-types.js'
import {
	type getTransactionByIdMeta,
	type getTransactionsMeta,
} from './endpoints.js'

export type GetTransactionsFunction = EndpointFunction<
	typeof getTransactionsMeta
>
export declare const getTransactions: GetTransactionsFunction

export type GetTransactionByIdFunction = EndpointFunction<
	typeof getTransactionByIdMeta
>
export declare const getTransactionById: GetTransactionByIdFunction
