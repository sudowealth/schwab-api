import { z } from 'zod'
import { sdkEnum } from '../../utils/schema-utils.js'

export const InstrumentAssetTypeEnum = sdkEnum([
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
