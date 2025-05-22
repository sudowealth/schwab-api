import { z } from 'zod'

/**
 * Comprehensive asset type enum combining all possible asset types
 * used across the API
 */
export const AssetTypeEnum = z.enum([
	'BOND',
	'EQUITY',
	'ETF',
	'EXTENDED',
	'FOREX',
	'FUTURE',
	'FUTURE_OPTION',
	'FUNDAMENTAL',
	'INDEX',
	'INDICATOR',
	'MUTUAL_FUND',
	'OPTION',
	'UNKNOWN',
	'CASH_EQUIVALENT',
	'FIXED_INCOME',
	'PRODUCT',
	'CURRENCY',
	'COLLECTIVE_INVESTMENT',
])

export type AssetType = z.infer<typeof AssetTypeEnum>

/**
 * Base instrument schema containing common fields across all instrument types
 * This provides a foundation that specific instrument types can extend
 */
export const BaseInstrumentSchema = z.object({
	symbol: z.string().describe('Ticker symbol for the instrument'),
	description: z.string().describe('Description of the instrument'),
	assetType: AssetTypeEnum.describe('Type of financial instrument'),
	cusip: z.string().optional().describe('CUSIP identifier'),
	exchange: z
		.string()
		.optional()
		.describe('Exchange where the instrument is traded'),
	netChange: z.number().optional().describe('Net price change'),
	instrumentId: z
		.number()
		.int()
		.optional()
		.describe('Numerical identifier for the instrument'),
})

export type BaseInstrument = z.infer<typeof BaseInstrumentSchema>
