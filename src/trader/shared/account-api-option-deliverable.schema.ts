import { z } from 'zod/v4'
import { ApiCurrencyType } from './api-currency-type.schema'
import { assetType } from './asset-type.schema'

export const AccountAPIOptionDeliverable = z.object({
	symbol: z.string(),
	deliverableUnits: z.number(),
	apiCurrencyType: ApiCurrencyType,
	assetType: assetType,
})
export type AccountAPIOptionDeliverable = z.infer<
	typeof AccountAPIOptionDeliverable
>
