import { z } from 'zod'
import { sdkEnum } from '../../utils/schema-utils.js'

export const ApiCurrencyType = sdkEnum(['USD', 'CAD', 'EUR', 'JPY'])
export type ApiCurrencyType = z.infer<typeof ApiCurrencyType>
