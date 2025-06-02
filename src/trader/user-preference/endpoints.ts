import { TRADER } from '../../constants'
import { type EndpointMetadata } from '../../core/http'
import { ErrorResponseSchema } from '../../errors'
import { GetUserPreferenceResponse } from './schema'

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
