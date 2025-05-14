import { z } from 'zod'

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

// --- Get User Preference ---
export const GetUserPreferenceRequestPathParams = z.never()
export type GetUserPreferenceRequestPathParams = z.infer<
	typeof GetUserPreferenceRequestPathParams
>

export const GetUserPreferenceRequestQueryParams = z.never()
export type GetUserPreferenceRequestQueryParams = z.infer<
	typeof GetUserPreferenceRequestQueryParams
>

export const GetUserPreferenceResponseBody = UserPreference
export type GetUserPreferenceResponseBody = z.infer<
	typeof GetUserPreferenceResponseBody
>
