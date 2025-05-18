export * from './schema'
export * from './endpoints'

// Explicitly declare the function type so TypeScript recognizes it
import { type GetPriceHistoryResponseBodySchema } from './schema'

export type GetPriceHistoryFunction = (params: { 
  symbol: string;
  periodType?: string;
  period?: number;
  frequencyType?: string;
  frequency?: number;
  startDate?: number;
  endDate?: number;
  needExtendedHoursData?: boolean;
}) => Promise<GetPriceHistoryResponseBodySchema>
export declare const getPriceHistory: GetPriceHistoryFunction