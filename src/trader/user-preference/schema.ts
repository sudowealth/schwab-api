import { z } from 'zod'
import { mergeShapes } from '../../utils/schema-utils'

const UserPreferenceAccount = z.object({
	accountNumber: z.string(),
	primaryAccount: z.boolean().default(false),
	type: z.string(),
	nickName: z.string(),
	accountColor: z.enum(['Green', 'Blue']),
	displayAcctId: z.string(),
	autoPositionEffect: z.boolean().default(false),
})

const StreamerInfo = z.object({
	streamerSocketUrl: z.string(),
	schwabClientCustomerId: z.string(),
	schwabClientCorrelId: z.string(),
	schwabClientChannel: z.string(),
	schwabClientFunctionId: z.string(),
})

const Offer = z.object({
	level2Permissions: z.boolean().default(false),
	mktDataPermission: z.string(),
})

const UserPreference = z.object({
	accounts: z.array(UserPreferenceAccount),
	streamerInfo: z.array(StreamerInfo),
	offers: z.array(Offer),
})
type UserPreference = z.infer<typeof UserPreference>

// Path Parameters Schema for GET /userpreference (no path params)
export const GetUserPreferencePathParams = z.object({})
export type GetUserPreferencePathParams = z.infer<
	typeof GetUserPreferencePathParams
>

// Query Parameters Schema for GET /userpreference (no query params)
export const GetUserPreferenceQueryParams = z.object({})
export type GetUserPreferenceQueryParams = z.infer<
	typeof GetUserPreferenceQueryParams
>

// Request Params Schema for GET /userpreference (merged path + query params)
export const GetUserPreferenceParams = z.object(
	mergeShapes(
		GetUserPreferenceQueryParams.shape,
		GetUserPreferencePathParams.shape,
	),
)
export type GetUserPreferenceParams = z.infer<typeof GetUserPreferenceParams>

// Response Body Schema for GET /userpreference
export const GetUserPreferenceResponse = UserPreference
export type GetUserPreferenceResponse = z.infer<
	typeof GetUserPreferenceResponse
>
