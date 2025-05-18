import { z } from 'zod'

export const ApiCurrencyType = z.enum(['USD', 'CAD', 'EUR', 'JPY'])
export type ApiCurrencyType = z.infer<typeof ApiCurrencyType>
