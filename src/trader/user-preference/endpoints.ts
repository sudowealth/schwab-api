import { createEndpoint } from '../../core/http'
import {
	GetUserPreferenceRequestPathParams,
	GetUserPreferenceRequestQueryParams,
	GetUserPreferenceResponseBody,
} from './schema'

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
	pathSchema: GetUserPreferenceRequestPathParams,
	querySchema: GetUserPreferenceRequestQueryParams,
	responseSchema: GetUserPreferenceResponseBody,
	description: 'Retrieves user preferences.',
})
