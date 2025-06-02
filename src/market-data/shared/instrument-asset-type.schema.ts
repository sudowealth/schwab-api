import { z } from 'zod/v4'

export const InstrumentAssetTypeEnum = z.enum([
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
])
export type InstrumentAssetTypeEnum = z.infer<typeof InstrumentAssetTypeEnum>
