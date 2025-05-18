export * from './schema'
export * from './endpoints'

// Explicitly declare the function type so TypeScript recognizes it
import { type OptionChainSchema, type OptionExpirationChainResponseBodySchema } from './schema'

export type GetOptionChainFunction = (params: { 
  symbol: string;
  contractType?: string;
  strikeCount?: number;
  includeQuotes?: boolean;
  strategy?: string;
  interval?: number;
  strike?: number;
  range?: string;
  fromDate?: string;
  toDate?: string;
  volatility?: number;
  underlyingPrice?: number;
  interestRate?: number;
  daysToExpiration?: number;
  expMonth?: string;
  optionType?: string;
}) => Promise<OptionChainSchema>
export declare const getOptionChain: GetOptionChainFunction

export type GetOptionExpirationChainFunction = (params: { 
  symbol: string;
  contractType?: string;
}) => Promise<OptionExpirationChainResponseBodySchema>
export declare const getOptionExpirationChain: GetOptionExpirationChainFunction