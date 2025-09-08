export * from './schema.js'
export * from './endpoints.js'

import { type EndpointFunction } from '../../core/endpoint-types.js'
import { type getUserPreferenceMeta } from './endpoints.js'

export type GetUserPreferenceFunction = EndpointFunction<
	typeof getUserPreferenceMeta
>
export declare const getUserPreference: GetUserPreferenceFunction
