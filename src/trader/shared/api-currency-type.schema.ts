import { z } from 'zod/v4'

export const ApiCurrencyType = z.enum(['USD', 'CAD', 'EUR', 'JPY'])
export type ApiCurrencyType = z.infer<typeof ApiCurrencyType>
