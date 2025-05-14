import { createEndpoint } from '../../core/http'
import { GetUserPreferenceResponseBody } from './schema'

export const getUserPreference = createEndpoint<
	never,
	never,
	never,
	GetUserPreferenceResponseBody,
	'GET',
	any
>({
	method: 'GET',
	path: '/trader/v1/userPreference',
	responseSchema: GetUserPreferenceResponseBody,
	description: 'Retrieves user preferences.',
})
