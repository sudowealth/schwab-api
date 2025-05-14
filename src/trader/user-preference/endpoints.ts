import { UserPreference } from './schema'
import { createEndpoint } from '../../core/http'
import { z } from 'zod'

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
