import { z } from 'zod'
import { ApiCurrencyType } from './api-currency-type.schema.js'
import { assetType } from './asset-type.schema.js'

export const AccountAPIOptionDeliverable = z.object({
	symbol: z.string(),
	deliverableUnits: z.number(),
	apiCurrencyType: ApiCurrencyType.optional(),
	assetType: assetType.optional(),
})
export type AccountAPIOptionDeliverable = z.infer<
	typeof AccountAPIOptionDeliverable
>
