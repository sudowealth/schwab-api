import { z } from 'zod'

export const assetType = z.enum([
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
