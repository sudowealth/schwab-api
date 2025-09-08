export * from './schema.js'
export * from './endpoints.js'

import { type EndpointFunction } from '../../core/endpoint-types.js'
import {
	type getAccountsMeta,
	type getAccountNumbersMeta,
	type getAccountByNumberMeta,
} from './endpoints.js'

export type GetAccountsFunction = EndpointFunction<typeof getAccountsMeta>
export declare const getAccounts: GetAccountsFunction

export type GetAccountByNumberFunction = EndpointFunction<
	typeof getAccountByNumberMeta
>
export declare const getAccountByNumber: GetAccountByNumberFunction

export type GetAccountNumbersFunction = EndpointFunction<
	typeof getAccountNumbersMeta
>
export declare const getAccountNumbers: GetAccountNumbersFunction
