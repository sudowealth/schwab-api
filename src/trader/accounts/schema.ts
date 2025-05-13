import { z } from "zod";
import { AssetType, ApiCurrencyType } from "../../schemas";

export const AccountAPIOptionDeliverable = z.object({
  symbol: z.string(),
  deliverableUnits: z.number(),
  apiCurrencyType: ApiCurrencyType,
  assetType: AssetType,
});
export type AccountAPIOptionDeliverable = z.infer<
  typeof AccountAPIOptionDeliverable
>;

export const AccountsBaseInstrument = z.object({
  assetType: AssetType,
  cusip: z.string().optional(), // Made optional based on some TransactionInstrument variations
  symbol: z.string(),
  description: z.string().optional(),
  instrumentId: z.number().int().optional(),
  netChange: z.number().optional(),
});
export type AccountsBaseInstrument = z.infer<typeof AccountsBaseInstrument>;

export const AccountCashEquivalent = AccountsBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.CASH_EQUIVALENT),
  type: z
    .enum(["SWEEP_VEHICLE", "SAVINGS", "MONEY_MARKET_FUND", "UNKNOWN"])
    .optional(),
  underlyingSymbol: z.string().optional(),
});
export type AccountCashEquivalent = z.infer<typeof AccountCashEquivalent>;

export const AccountEquity = AccountsBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.EQUITY),
});
export type AccountEquity = z.infer<typeof AccountEquity>;

export const AccountFixedIncome = AccountsBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.FIXED_INCOME),
  maturityDate: z.string().datetime().optional(),
  factor: z.number().optional(),
  variableRate: z.number().optional(),
});
export type AccountFixedIncome = z.infer<typeof AccountFixedIncome>;

export const AccountMutualFund = AccountsBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.MUTUAL_FUND),
});
export type AccountMutualFund = z.infer<typeof AccountMutualFund>;

export const AccountOption = AccountsBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.OPTION),
  optionDeliverables: z
    .array(z.lazy(() => AccountAPIOptionDeliverable))
    .optional(),
  putCall: z.enum(["PUT", "CALL", "UNKNOWN"]).optional(),
  optionMultiplier: z.number().int().optional(),
  type: z.enum(["VANILLA", "BINARY", "BARRIER", "UNKNOWN"]).optional(),
  underlyingSymbol: z.string().optional(), // Added as it's common for options
});
export type AccountOption = z.infer<typeof AccountOption>;

export const AccountFuture = AccountsBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.FUTURE),
  expirationDate: z.string().datetime().optional(),
  activeContract: z.boolean().default(false).optional(),
});
export type AccountFuture = z.infer<typeof AccountFuture>;

export const AccountForex = AccountsBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.FOREX),
});
export type AccountForex = z.infer<typeof AccountForex>;

export const AccountIndex = AccountsBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.INDEX),
});
export type AccountIndex = z.infer<typeof AccountIndex>;

export const AccountProduct = AccountsBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.PRODUCT), // Assuming PRODUCT is in AssetType enum
});
export type AccountProduct = z.infer<typeof AccountProduct>;

export const AccountCurrency = AccountsBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.CURRENCY),
});
export type AccountCurrency = z.infer<typeof AccountCurrency>;

export const AccountCollectiveInvestment = AccountsBaseInstrument.extend({
  assetType: z.literal(AssetType.Enum.COLLECTIVE_INVESTMENT),
});
export type AccountCollectiveInvestment = z.infer<
  typeof AccountCollectiveInvestment
>;

export const AccountsInstrument = z.discriminatedUnion("assetType", [
  AccountCashEquivalent,
  AccountEquity,
  AccountFixedIncome,
  AccountMutualFund,
  AccountOption,
  AccountFuture,
  AccountForex,
  AccountIndex,
  AccountProduct,
  AccountCurrency,
  AccountCollectiveInvestment,
]);
export type AccountsInstrument = z.infer<typeof AccountsInstrument>;

// --- Position Schema ---
export const Position = z.object({
  shortQuantity: z.number().optional(),
  averagePrice: z.number().optional(),
  currentDayProfitLoss: z.number().optional(),
  currentDayProfitLossPercentage: z.number().optional(),
  longQuantity: z.number().optional(),
  settledLongQuantity: z.number().optional(),
  settledShortQuantity: z.number().optional(),
  agedQuantity: z.number().optional(),
  instrument: z.lazy(() => AccountsInstrument), // Defined above
  marketValue: z.number().optional(),
  maintenanceRequirement: z.number().optional(),
  averageLongPrice: z.number().optional(),
  averageShortPrice: z.number().optional(),
  taxLotAverageLongPrice: z.number().optional(),
  taxLotAverageShortPrice: z.number().optional(),
  longOpenProfitLoss: z.number().optional(),
  shortOpenProfitLoss: z.number().optional(),
  previousSessionLongQuantity: z.number().optional(),
  previousSessionShortQuantity: z.number().optional(),
  currentDayCost: z.number().optional(),
});
export type Position = z.infer<typeof Position>;

// --- Account Balance Schemas ---
export const MarginInitialBalance = z.object({
  accruedInterest: z.number().optional(),
  availableFundsNonMarginableTrade: z.number().optional(),
  bondValue: z.number().optional(),
  buyingPower: z.number().optional(),
  cashBalance: z.number().optional(),
  cashAvailableForTrading: z.number().optional(),
  cashReceipts: z.number().optional(),
  dayTradingBuyingPower: z.number().optional(),
  dayTradingBuyingPowerCall: z.number().optional(),
  dayTradingEquityCall: z.number().optional(),
  equity: z.number().optional(),
  equityPercentage: z.number().optional(),
  liquidationValue: z.number().optional(),
  longMarginValue: z.number().optional(),
  longOptionMarketValue: z.number().optional(),
  longStockValue: z.number().optional(),
  maintenanceCall: z.number().optional(),
  maintenanceRequirement: z.number().optional(),
  margin: z.number().optional(),
  marginEquity: z.number().optional(),
  moneyMarketFund: z.number().optional(),
  mutualFundValue: z.number().optional(),
  regTCall: z.number().optional(),
  shortMarginValue: z.number().optional(),
  shortOptionMarketValue: z.number().optional(),
  shortStockValue: z.number().optional(),
  totalCash: z.number().optional(),
  isInCall: z.boolean().optional(),
  unsettledCash: z.number().optional(),
  pendingDeposits: z.number().optional(),
  marginBalance: z.number().optional(),
  shortBalance: z.number().optional(),
  accountValue: z.number().optional(),
});
export type MarginInitialBalance = z.infer<typeof MarginInitialBalance>;

export const MarginBalance = z.object({
  availableFunds: z.number().optional(),
  availableFundsNonMarginableTrade: z.number().optional(),
  buyingPower: z.number().optional(),
  buyingPowerNonMarginableTrade: z.number().optional(),
  dayTradingBuyingPower: z.number().optional(),
  dayTradingBuyingPowerCall: z.number().optional(),
  equity: z.number().optional(),
  equityPercentage: z.number().optional(),
  longMarginValue: z.number().optional(),
  maintenanceCall: z.number().optional(),
  maintenanceRequirement: z.number().optional(),
  marginBalance: z.number().optional(),
  regTCall: z.number().optional(),
  shortBalance: z.number().optional(),
  shortMarginValue: z.number().optional(),
  sma: z.number().optional(),
  isInCall: z.boolean().optional(),
  stockBuyingPower: z.number().optional(),
  optionBuyingPower: z.number().optional(),
});
export type MarginBalance = z.infer<typeof MarginBalance>;

export const CashInitialBalance = z.object({
  accruedInterest: z.number().optional(),
  cashAvailableForTrading: z.number().optional(),
  cashAvailableForWithdrawal: z.number().optional(),
  cashBalance: z.number().optional(),
  bondValue: z.number().optional(),
  cashReceipts: z.number().optional(),
  liquidationValue: z.number().optional(),
  longOptionMarketValue: z.number().optional(),
  longStockValue: z.number().optional(),
  moneyMarketFund: z.number().optional(),
  mutualFundValue: z.number().optional(),
  shortOptionMarketValue: z.number().optional(),
  shortStockValue: z.number().optional(),
  isInCall: z.boolean().optional(),
  unsettledCash: z.number().optional(),
  cashDebitCallValue: z.number().optional(),
  pendingDeposits: z.number().optional(),
  accountValue: z.number().optional(),
});
export type CashInitialBalance = z.infer<typeof CashInitialBalance>;

export const CashBalance = z.object({
  cashAvailableForTrading: z.number().optional(),
  cashAvailableForWithdrawal: z.number().optional(),
  cashCall: z.number().optional(),
  longNonMarginableMarketValue: z.number().optional(),
  totalCash: z.number().optional(),
  cashDebitCallValue: z.number().optional(),
  unsettledCash: z.number().optional(),
  accruedInterest: z.number().optional(),
  cashBalance: z.number().optional(),
  cashReceipts: z.number().optional(),
  longOptionMarketValue: z.number().optional(),
  liquidationValue: z.number().optional(),
  longMarketValue: z.number().optional(),
  moneyMarketFund: z.number().optional(),
  savings: z.number().optional(),
  shortMarketValue: z.number().optional(),
  pendingDeposits: z.number().optional(),
  mutualFundValue: z.number().optional(),
  bondValue: z.number().optional(),
  shortOptionMarketValue: z.number().optional(),
});
export type CashBalance = z.infer<typeof CashBalance>;

// --- Account Core Schemas ---
export const SecuritiesAccountBase = z.object({
  type: z.string(), // Will be 'MARGIN' or 'CASH' in extending types
  accountNumber: z.string(),
  roundTrips: z.number().int().optional(),
  isDayTrader: z.boolean().default(false).optional(),
  isClosingOnlyRestricted: z.boolean().default(false).optional(),
  pfcbFlag: z.boolean().default(false).optional(),
  positions: z.array(Position).default([]).optional(),
});
export type SecuritiesAccountBase = z.infer<typeof SecuritiesAccountBase>;

export const MarginAccount = SecuritiesAccountBase.extend({
  type: z.literal("MARGIN"),
  initialBalances: MarginInitialBalance.optional(),
  currentBalances: MarginBalance.optional(),
  projectedBalances: MarginBalance.optional(), // MCP used MarginBalance here
});
export type MarginAccount = z.infer<typeof MarginAccount>;

export const CashAccount = SecuritiesAccountBase.extend({
  type: z.literal("CASH"),
  initialBalances: CashInitialBalance.optional(),
  currentBalances: CashBalance.optional(),
  projectedBalances: z
    .object({
      // MCP had a specific structure here
      cashAvailableForTrading: z.number().optional(),
      cashAvailableForWithdrawal: z.number().optional(),
    })
    .optional(),
});
export type CashAccount = z.infer<typeof CashAccount>;

export const SecuritiesAccount = z.discriminatedUnion("type", [
  MarginAccount,
  CashAccount,
]);
export type SecuritiesAccount = z.infer<typeof SecuritiesAccount>;

// Wrapper for GET /accounts responses
export const AccountWrapper = z.object({
  securitiesAccount: SecuritiesAccount,
  // MCP also had an aggregatedBalance here, can be added if needed by endpoints
  // aggregatedBalance: z.object({
  //   currentLiquidationValue: z.number().optional(),
  //   liquidationValue: z.number().optional(),
  // }).optional(),
});
export type AccountWrapper = z.infer<typeof AccountWrapper>;

// Schema for an array of accounts, typically for GET /accounts
export const AccountsArraySchema = z.array(AccountWrapper); // MCP used AccountWrapper
export type AccountsArraySchema = z.infer<typeof AccountsArraySchema>;

// For queries like GET /accounts?fields=positions
export const AccountsQueryParamsSchema = z
  .object({
    fields: z.enum(["positions", "balances"]).optional(),
  })
  .optional();
export type AccountsQueryParamsSchema = z.infer<
  typeof AccountsQueryParamsSchema
>;
