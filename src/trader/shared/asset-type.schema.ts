import { z } from 'zod'
import { sdkEnum } from '../../utils/schema-utils.js'

export const assetType = sdkEnum([
	'EQUITY',
	'MUTUAL_FUND',
	'OPTION',
	'FUTURE',
	'FOREX',
	'INDEX',
	'CASH_EQUIVALENT',
	'FIXED_INCOME',
	'PRODUCT',
	'CURRENCY',
	'COLLECTIVE_INVESTMENT',
])
export type AssetType = z.infer<typeof assetType>
