import { TRADER } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import { GetUserPreferenceResponseBody } from './schema'

export const getUserPreferenceMeta: EndpointMetadata<
	never,
	never,
	never,
	GetUserPreferenceResponseBody,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.USER_PREFERENCES.GET_USER_PREFERENCES,
	responseSchema: GetUserPreferenceResponseBody,
	errorSchema: ErrorResponseSchema,
	description: 'Retrieves user preferences.',
}
