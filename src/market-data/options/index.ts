export * from './schema.js'
export * from './endpoints.js'

import { type EndpointFunction } from '../../core/endpoint-types.js'
import {
	type getOptionChainMeta,
	type getOptionExpirationChainMeta,
} from './endpoints.js'

export type GetOptionChainFunction = EndpointFunction<typeof getOptionChainMeta>
export declare const getOptionChain: GetOptionChainFunction

export type GetOptionExpirationChainFunction = EndpointFunction<
	typeof getOptionExpirationChainMeta
>
export declare const getOptionExpirationChain: GetOptionExpirationChainFunction
