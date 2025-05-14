import { type z } from 'zod'
import { createEndpoint } from '../../core/http'
import { UserPreference } from './schema'

export type GetUserPreferenceRequestPathParams = never
export type GetUserPreferenceRequestQueryParams = never
export type GetUserPreferenceResponseBody = z.infer<typeof UserPreference>

export const getUserPreference = createEndpoint<
	GetUserPreferenceRequestPathParams,
	GetUserPreferenceRequestQueryParams,
	never,
	GetUserPreferenceResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/userPreference',
	responseSchema: UserPreference,
	description: 'Retrieves user preferences.',
})
