import { TRADER } from '../../constants'
import { createRequestContext, createEndpoint } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import { GetUserPreferenceResponseBody } from './schema'

// Create a default context to use with our endpoints
const context = createRequestContext()
export const getUserPreference = createEndpoint<
	never,
	never,
	never,
	GetUserPreferenceResponseBody,
	'GET',
	ErrorResponseSchema
>(context, {
	method: 'GET',
	path: TRADER.USER_PREFERENCES.GET_USER_PREFERENCES,
	responseSchema: GetUserPreferenceResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Retrieves user preferences.',
})
