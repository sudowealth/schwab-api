import { TRADER } from '../../constants'
import { ErrorResponseSchema } from '../../core/errors'
import { createEndpoint } from '../../core/http'
import { GetUserPreferenceResponseBody } from './schema'

export const getUserPreference = createEndpoint<
	never,
	never,
	never,
	GetUserPreferenceResponseBody,
	'GET',
	ErrorResponseSchema
>({
	method: 'GET',
	path: TRADER.USER_PREFERENCES.GET_USER_PREFERENCES,
	responseSchema: GetUserPreferenceResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Retrieves user preferences.',
})
