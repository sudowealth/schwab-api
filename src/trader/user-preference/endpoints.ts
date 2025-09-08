import { TRADER } from '../../constants.js'
import { type EndpointMetadata } from '../../core/http.js'
import { ErrorResponseSchema } from '../../errors.js'
import { GetUserPreferenceResponse } from './schema.js'

export const getUserPreferenceMeta: EndpointMetadata<
	never,
	never,
	never,
	GetUserPreferenceResponse,
	'GET',
	ErrorResponseSchema
> = {
	method: 'GET',
	path: TRADER.USER_PREFERENCES.GET_USER_PREFERENCES,
	responseSchema: GetUserPreferenceResponse,
	errorSchema: ErrorResponseSchema,
	description: 'Get user preferences.',
}
